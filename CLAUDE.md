# Guía de Desarrollo LukenFit

## Estado de la App

**LukenFit** es una aplicación **Offline-First** y **Resiliente** construida con React, TailwindCSS, Supabase, y Dexie.js. Implementa arquitecturas de sincronización avanzadas con:

- ✅ **The Vault**: Sistema de escritura diferida para sincronización asíncrona sin bloqueo de UI
- ✅ **Single Source of Truth**: Supabase Cloud es la fuente definitiva de datos
- ✅ **Cache Inteligente**: Dexie.js (IndexedDB) para persistencia local con TTLs
- ✅ **Timezone Enforcement**: Todas las fechas operan estrictamente en zona horaria de Argentina
- ✅ **Zero Silent Failures**: Todo error es capturado, logueado y reportado al usuario

> [!IMPORTANT]
> Esta app mantiene estándares estrictos de calidad y resiliencia. Todo código nuevo debe cumplir con las reglas documentadas a continuación.

---

## Guía de Estilo
- **Componentes**: Uso estricto de Componentes Funcionales (React).
- **Estilos**: TailwindCSS para todo el estilizado. Evitar CSS puro salvo excepciones (animaciones complejas).
- **Iconos**: Utilizar `Lucide React` para consistencia visual.

## Reglas de Estado
- **Estado Global**: Debe residir exclusivamente en `Context` (ej. `TrackerContext`).
- **Lógica**: Extraer lógica compleja o de negocio a Custom Hooks especializados (`useTrackerData`, `useFoodEntry`, etc.).
- **Límite de Archivo**: Prohibido crear archivos de más de 300 líneas. Si crece, refactorizar y dividir.

## Manejo de Datos
- **Fechas**: Priorizar siempre la consistencia de fechas usando `src/utils/dateUtils.js`.
- **Timezone**: Respetar siempre la zona horaria de Argentina (TZ) al manipular fechas y timestamps.

## Estándares de Resiliencia y Datos

### 🔒 Single Source of Truth (SSOT)
**Supabase Cloud es la única fuente de verdad.**

- ✅ La cache local (Dexie.js) es un **espejo temporal** con TTL de 5 minutos
- ✅ En conflictos, **siempre prevalece Supabase Cloud**
- ✅ Las escrituras locales son **optimistas** hasta confirmación del servidor
- ❌ **NUNCA** considerar IndexedDB como fuente primaria para reconciliar datos

```javascript
// ✅ Correcto: Cloud como SSOT
const cloudData = await supabase.from('food_logs').select('*');
const localData = await db.foodLogs.toArray();
const truth = cloudData.data || localData; // Cloud primero

// ❌ Incorrecto: Local como SSOT
const localData = await db.foodLogs.toArray();
const cloudData = await supabase.from('food_logs').select('*');
const truth = localData.length > 0 ? localData : cloudData.data;
```

---

### 📦 The Vault (Pending Writes)

**Sistema de escritura diferida para sincronización asíncrona sin bloquear UI.**

- ✅ Toda escritura fallida **DEBE** guardarse en `pending_writes` de IndexedDB
- ✅ El `useVaultWorker.js` procesa The Vault cada 30 segundos automáticamente
- ✅ Mostrar badge visual cuando `vaultCount > 0` para transparencia del usuario
- ✅ Implementar retry exponencial: 0s → 30s → 60s → 120s
- ❌ **NUNCA** perder datos del usuario por fallo de red

**Estructura de Pending Write:**
```javascript
{
  id: `${table}_${userId}_${Date.now()}`,
  table: 'food_logs' | 'steps_logs' | 'water_logs' | 'weight_logs',
  operation: 'insert' | 'update' | 'delete',
  data: {...}, // Payload completo
  userId: string,
  createdAt: timestamp,
  retryCount: number
}
```

---

### 🌎 Timezone: fechas en Argentina, horas en reloj local

**Las FECHAS (el "día" de cada registro) operan estrictamente en zona horaria de Argentina (America/Argentina/Buenos_Aires).** Esto define a qué día pertenece una comida, un peso, un workout, etc.

- ✅ Usar `getArgentinaDateString()` / `toArgentinaDateString()` de `dateUtils.ts` para el día (YYYY-MM-DD)
- ✅ Formatear fechas con `timeZone: 'America/Argentina/Buenos_Aires'`
- ✅ Validar fechas antes de guardar: `if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return` 
- ❌ **NUNCA** usar `new Date().toISOString().split('T')[0]` para obtener el día (devuelve el día en UTC, se corre entre 21:00 y medianoche ART)

**Las HORAS de comida (`getCurrentTimeString` / `getCurrentHour`) reflejan a propósito el reloj LOCAL del usuario**, no el de Argentina. Así la detección de tipo de comida (desayuno/almuerzo/cena) funciona para usuarios de cualquier país. Esta es una excepción consciente a la regla de fechas.

```javascript
// ✅ Correcto: el DÍA siempre en Argentina
import { getArgentinaDateString } from '@/utils/dateUtils';
const dateStr = getArgentinaDateString();

// ✅ Correcto: la HORA en el reloj local del usuario (intencional)
const timeStr = getCurrentTimeString();

// ❌ Incorrecto: el día en UTC se corre un día cerca de medianoche
const dateStr = new Date().toISOString().split('T')[0];
```

---

### 🚨 Prohibición de Silent Failures

**Todo error debe ser capturado, logueado y reportado al usuario de forma explícita.**

- ✅ Todo bloque `try/catch` **DEBE** incluir `console.error()` con contexto
- ✅ Errores críticos **DEBEN** actualizar `syncStatus` con mensaje visible
- ✅ Guardar escrituras fallidas en The Vault antes de mostrar error
- ❌ **NUNCA** usar `catch {}` vacíos
- ❌ **NUNCA** fallar silenciosamente sin feedback al usuario

```javascript
// ✅ Correcto: Error handling completo
try {
  await supabase.from('food_logs').insert(newLog);
  setSyncStatus({ type: 'success', message: 'Guardado exitoso' });
} catch (error) {
  console.error('[FoodLog] Error al guardar:', error);
  await saveToPendingWrites('food_logs', 'insert', newLog);
  setSyncStatus({ 
    type: 'error', 
    message: 'Error de conexión. Sincronizará automáticamente.' 
  });
}

// ❌ Incorrecto: Silent failure
try {
  await supabase.from('food_logs').insert(newLog);
} catch (error) {
  // ❌ Sin logging ni feedback
}
```

---

### 📏 Límite de 300 Líneas para Hooks de Sincronización

**Hooks de sincronización (`useTrackerSync`, `useVaultWorker`, etc.) NUNCA deben superar 300 líneas.**

- ✅ Extraer lógica de Vault a `useVaultWorker.js`
- ✅ Extraer lógica de hidratación inicial a `useInitialHydration.js`
- ✅ Extraer utilidades de storage a `storageUtils.js`
- ✅ Extraer resolvers de sync a `useSyncResolver.js`
- ❌ **NUNCA** crear archivos monolíticos > 300 líneas

**Verificación obligatoria:**
```bash
wc -l src/hooks/useTrackerSync.js  # Debe ser ≤ 300
```

---

## Resiliencia
- **Manejo de Errores**: Todas las operaciones de Supabase deben incluir un bloque `try/catch` que registre el error en consola y, si es crítico, actualice el `syncStatus` en el contexto.



## Patrones
### ✅ Good
- **Early Returns**: Usar retornos tempranos para mejorar la legibilidad y reducir el anidamiento.
- **Documentación**: JSDoc obligatorio para funciones complejas o hooks compartidos.
- **Performance**: Uso estratégico de `useMemo` y `useCallback` en Providers y componentes pesados.

### ❌ Bad
- **Prop Drilling**: Evitar pasar props a través de múltiples niveles; usar Context.
- **Lógica en JSX**: No mezclar lógica de transformación de datos dentro del renderizado.
- **Mutación Directa**: Nunca mutar estados locales que reflejen datos de Supabase; usar siempre las funciones de actualización del store.
