# 🔍 REPORTE TÉCNICO FORENSE - LUKENFIT DATA INTEGRITY

**Analista**: Principal Solution Architect
**Fecha**: 2026-01-17
**Severidad**: 🔴 CRÍTICA
**Estado**: Análisis completado

---

## 📊 RESUMEN EJECUTIVO

Se ha identificado el **punto de falla crítico** que causa la pérdida de datos de Oura (y potencialmente otros dominios). El problema es una **cadena de fallos sistémicos** que involucra:

1. ❌ **Errores silenciosos** que ocultan fallos de escritura
2. ❌ **Lógica de cache defensiva** que preserva datos obsoletos
3. ❌ **Inconsistencia en fuente de verdad** para estado de conexión
4. ⚠️ **Falta de validación de user_id** antes de operaciones de escritura

---

## 🎯 PUNTO DE FALLA IDENTIFICADO: "The Silent Save Failure"

### Escenario de Reproducción del Bug Oura

```
[MÓVIL - 10:00 AM]
├─ Usuario agrega datos Oura (Sleep: 85, Readiness: 80)
├─ saveOuraLog() → ✅ localStorage actualizado
├─ saveOuraEntry() → 🔄 Llamada a Supabase iniciada
│  ├─ Red lenta / timeout (30s)
│  └─ catch (err) { } → ❌ ERROR SILENCIOSO (useBiometrics.js:122)
└─ Usuario ve sus datos en móvil ✅ (localStorage)

[SUPABASE - ESTADO REAL]
└─ oura_log: [] ← VACÍO (save nunca completó)

[DESKTOP - 10:30 AM]
├─ Login → fetchAllData()
├─ Supabase responde: { ouraLog: [] }
├─ Condición: if (data.ouraLog?.length > 0) ← FALSE
├─ NO sobrescribe estado local (useTrackerSync.js:146)
├─ NO actualiza cache (storageUtils.js:66)
└─ Desktop muestra array vacío ❌

[MÓVIL - 10:45 AM]
├─ Usuario reabre app
├─ loadCachedData() → Lee localStorage
├─ Ve sus datos Oura ✅
└─ Cree que todo está sincronizado ❌ (falsa sensación de seguridad)

[RESULTADO]
├─ Móvil: Datos visibles (localStorage)
├─ Desktop: Sin datos (Supabase vacío)
└─ Fuente de verdad: DIVERGENTE 🔴
```

---

## 🐛 HALLAZGOS DETALLADOS

### 1. ERROR CRÍTICO: Catch Vacío en saveOuraEntry

**Archivo**: `src/hooks/useBiometrics.js:118-124`

```javascript
const saveOuraEntry = async (entry) => {
  if (useCloud) {
    try {
      await supabase.saveOura(entry);
    } catch (err) { }  // ← 🔴 TRAGA ERRORES SIN REGISTRAR
  }
};
```

**Impacto**:
- Fallos de red, timeouts, errores de permisos → **silenciados**
- Usuario cree que guardó correctamente (localStorage actualizado)
- Supabase nunca recibe los datos
- **Divergencia inmediata** entre local y cloud

**Ubicación similar**: `src/hooks/supabase/useSyncResolver.js:50-51` (force sync)

---

### 2. ERROR DE ARQUITECTURA: Lógica de Cache Defensiva

**Archivo**: `src/hooks/useTrackerSync.js:146`

```javascript
if (data.ouraLog?.length > 0) setOuraLog(data.ouraLog);
```

**Problema**:
- Si Supabase retorna `[]` (array vacío), **NO sobrescribe** el estado local
- El cache local (potencialmente obsoleto) se mantiene
- Violación del principio: **Supabase es la fuente de verdad**

**Archivo**: `src/utils/storageUtils.js:66`

```javascript
if (data.ouraLog?.length > 0) promises.push(storage.set(CACHE_KEYS.OURA, JSON.stringify(data.ouraLog)));
```

**Problema**:
- Si Supabase tiene array vacío, **no limpia el cache**
- Cache diverge permanentemente de Supabase
- Implementación incorrecta de Stale-While-Revalidate

---

### 3. ERROR DE CONSISTENCIA: Doble Fuente de Verdad para useCloud

**Archivo**: `src/context/TrackerContext.jsx:27`
```javascript
const useCloud = supabase.isAuthenticated && supabase.isOnline;
```

**Archivo**: `src/hooks/useTrackerSync.js:37`
```javascript
const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;
```

**Problema**:
- Dos definiciones de `useCloud` con lógicas diferentes
- `TrackerContext` pasa su `useCloud` a hooks de dominio (`biometrics`, `workouts`, `nutrition`)
- `useTrackerSync` usa su propio `useCloud` (con `offlineMode`)
- Si usuario activa modo offline:
  - `dataOperations` → NO guarda en cloud ✅
  - `biometrics.saveOuraEntry()` → **SÍ intenta guardar en cloud** ❌

**Impacto**:
- Comportamiento inconsistente entre módulos
- Flag de offlineMode no respetado uniformemente

---

### 4. RIESGO DE RACE CONDITION: user_id sin captura

**Archivo**: `src/hooks/supabase/useActivityData.js:156-169`

```javascript
const saveOura = useCallback(async (entry) => {
  return withSync(async () => {
    const { data, error } = await supabase
      .from('oura_log')
      .upsert(mappers.ouraToDb(entry, user.id), {  // ← user.id podría ser undefined
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data ? mappers.ouraFromDb(data) : null, error: null };
  }, { canUseSupabase, errorMessage: 'Error guardando datos Oura' });
}, [canUseSupabase, user?.id, withSync]);
```

**Problema**:
- Aunque poco probable, si `user` cambia entre:
  1. Check `canUseSupabase` (línea 8)
  2. Mapper `ouraToDb(entry, user.id)` (línea 160)
- El `user.id` podría ser `undefined` → Error en Supabase

**Mitigación actual**:
- `useCallback` con `user?.id` en deps → recrea función
- Pero no garantiza **snapshot** del `user.id` en el momento del check

---

## 🏗️ 3 MEJORAS ESTRUCTURALES PARA BLINDAR INTEGRIDAD

### 🛡️ MEJORA #1: "Error Visibility Pattern"

**Objetivo**: Hacer fallos visibles y rastreables

**Implementación**:

```javascript
// src/hooks/useBiometrics.js
const saveOuraEntry = async (entry) => {
  if (useCloud) {
    try {
      const result = await supabase.saveOura(entry);

      // Validar que el save fue exitoso
      if (result?.error) {
        console.error('[Oura] Save failed:', result.error);
        throw new Error(result.error.message);
      }

      console.log('[Oura] Save successful:', entry.date);
      return result;
    } catch (err) {
      // CRÍTICO: Registrar error con contexto
      console.error('[Oura] saveOuraEntry FAILED:', {
        date: entry.date,
        error: err.message,
        stack: err.stack,
        userId: user?.id
      });

      // Propagar error al caller para UI feedback
      throw err;
    }
  }
};
```

**Beneficios**:
- Errores rastreables en logs
- UI puede mostrar feedback al usuario
- Monitoring puede detectar patrones de fallo

**Aplicar también en**:
- `useSyncResolver.js:50-51` (force sync loops)
- Todos los wrappers de dominio

---

### 🛡️ MEJORA #2: "Cloud as Single Source of Truth"

**Objetivo**: Supabase siempre sobrescribe estado local, incluso si está vacío

**Implementación**:

```javascript
// src/hooks/useTrackerSync.js (líneas 139-148)
if (data) {
  // CAMBIO CRÍTICO: Eliminar validación de .length
  // Supabase es la fuente de verdad, SIEMPRE sobrescribe
  if (data.profile) setProfile(data.profile);
  if (data.targets) setCustomTargets(data.targets);

  // Arrays: sobrescribir SIEMPRE (incluso si vacíos)
  if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
  if (data.foodLog !== undefined) setFoodLog(data.foodLog);
  if (data.workouts !== undefined) setWorkoutLog(data.workouts);
  if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
  if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);  // ← FIX CRÍTICO
  if (data.waterLog !== undefined) setWaterLog(data.waterLog);

  await cacheData(data);  // Cache actualizado con arrays vacíos si corresponde

  setSaveStatus('✓ Sincronizado');
  setTimeout(() => setSaveStatus(''), 2000);
}
```

```javascript
// src/utils/storageUtils.js (líneas 57-69)
export const cacheData = async (data) => {
  try {
    const promises = [];

    // Profile & Targets: solo si existen
    if (data.profile) promises.push(storage.set(CACHE_KEYS.PROFILE, JSON.stringify(data.profile)));
    if (data.targets) promises.push(storage.set(CACHE_KEYS.TARGETS, JSON.stringify(data.targets)));

    // Arrays: SIEMPRE actualizar (incluso si vacíos)
    // Esto garantiza que cache refleja Supabase
    if (data.weightHistory !== undefined) promises.push(storage.set(CACHE_KEYS.WEIGHT, JSON.stringify(data.weightHistory)));
    if (data.foodLog !== undefined) promises.push(storage.set(CACHE_KEYS.FOOD, JSON.stringify(data.foodLog)));
    if (data.workouts !== undefined) promises.push(storage.set(CACHE_KEYS.WORKOUT, JSON.stringify(data.workouts)));
    if (data.stepsLog !== undefined) promises.push(storage.set(CACHE_KEYS.STEPS, JSON.stringify(data.stepsLog)));
    if (data.ouraLog !== undefined) promises.push(storage.set(CACHE_KEYS.OURA, JSON.stringify(data.ouraLog)));  // ← FIX
    if (data.waterLog !== undefined) promises.push(storage.set(CACHE_KEYS.WATER, JSON.stringify(data.waterLog)));

    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn('[Data] Failed to cache data:', err);
    return false;
  }
};
```

**Beneficios**:
- Fuente de verdad única y clara
- Cache siempre refleja Supabase
- Elimina divergencias silenciosas

---

### 🛡️ MEJORA #3: "Unified useCloud Flag"

**Objetivo**: Una sola fuente de verdad para estado de conexión

**Implementación**:

```javascript
// src/context/TrackerContext.jsx (líneas 24-76)
export const TrackerProvider = ({ children }) => {
  const supabase = useSupabase();

  // ELIMINAR: const useCloud = supabase.isAuthenticated && supabase.isOnline;

  // ... otros estados ...

  // 2. Sync Orchestrator (PRIMERO)
  const trackerSync = useTrackerSync({
    supabase,
    setProfile: biometrics.setProfile,
    // ... setters ...
  });

  // useCloud viene SOLO de trackerSync (incluye offlineMode)
  const useCloud = trackerSync.useCloud;  // ← FUENTE ÚNICA

  // 1. Core Domains (USAN useCloud de trackerSync)
  const workouts = useWorkouts(supabase, useCloud);
  const biometrics = useBiometrics(supabase, useCloud);
  const nutrition = useNutrition(supabase, useCloud, biometrics.customTargets, workouts.isTrainingDay);

  // ... resto del código ...
}
```

**Desafío**: `trackerSync` necesita setters de `biometrics`, `workouts`, `nutrition`, pero estos necesitan `useCloud` de `trackerSync`.

**Solución - Inversión de Dependencias**:

```javascript
// Opción A: useTrackerSync no necesita estado de dominio, solo setters
const trackerSync = useTrackerSync({
  supabase,
  setProfile: (profile) => setProfileState(profile),  // Direct setters
  setCustomTargets: (targets) => setTargetsState(targets),
  // ... etc
});

const useCloud = trackerSync.useCloud;

// Luego los hooks de dominio usan estos estados
const biometrics = useBiometrics(supabase, useCloud, profileState, targetsState);
```

**Opción B (más limpia): Mover offlineMode a nivel superior**

```javascript
const [offlineMode, setOfflineMode] = useState(false);
const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;

// Todos los hooks usan el mismo useCloud
const workouts = useWorkouts(supabase, useCloud);
const biometrics = useBiometrics(supabase, useCloud);
const trackerSync = useTrackerSync({ supabase, useCloud, offlineMode, setOfflineMode, ... });
```

**Beneficios**:
- Una sola definición de `useCloud`
- Flag `offlineMode` respetado consistentemente
- Comportamiento predecible

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Stop the Bleeding (Inmediato)
1. ✅ Fix catch vacío en `useBiometrics.js:122` → agregar logging + throw
2. ✅ Fix condiciones `.length > 0` en `useTrackerSync.js:146` y `storageUtils.js:66`
3. ✅ Agregar logging en `useSyncResolver.js` force sync loops

### Fase 2: Unify Source of Truth (Día 2)
4. ✅ Refactor `TrackerContext` para usar `useCloud` único
5. ✅ Mover `offlineMode` a nivel superior o invertir dependencias
6. ✅ Test exhaustivo de flujo offline → online → offline

### Fase 3: Resilience Hardening (Día 3-4)
7. ✅ Agregar `userId` snapshot en hooks de escritura
8. ✅ Implementar retry logic con exponential backoff para saves críticos
9. ✅ Agregar validación de respuesta de Supabase antes de confirmar éxito
10. ✅ Implementar "pending writes queue" para operaciones offline

---

## 🎓 LECCIONES ARQUITECTÓNICAS

1. **"Fail Loudly, Not Silently"**: Los errores silenciosos son **bombas de tiempo**
2. **"One Source of Truth"**: Cache debe ser **espejo**, no **competidor** de la nube
3. **"Explicit Over Implicit"**: Flags como `useCloud` deben tener **una sola definición**
4. **"Validate the Happy Path"**: Asumir que el save funcionó sin validar la respuesta es **peligroso**

---

## 📈 MÉTRICAS DE ÉXITO POST-FIX

- ✅ 100% de errores de escritura loggueados
- ✅ 0% de divergencia entre localStorage y Supabase (detectado en tests)
- ✅ Modo offline consistente en todos los módulos
- ✅ UI feedback inmediato en caso de fallo de sincronización

---

**Conclusión**: El bug de Oura no es un problema aislado, sino un **síntoma de patrones arquitectónicos débiles** en el manejo de errores y sincronización. Las 3 mejoras propuestas no solo resolverán el caso Oura, sino que blindarán **toda la capa de datos** contra futuros fallos.
