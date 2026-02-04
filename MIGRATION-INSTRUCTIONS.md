# 🔄 Migración: Agregar Campos de Sleep Timing

## Problema Resuelto
Esta migración agrega las columnas `bedtime` y `wake_time` a la tabla `oura_log` para habilitar:
- ✅ Visualización de horarios promedio de sueño en Oura Tab
- ✅ Análisis de timing nutricional (gap comida-cama) en Dashboard Tab

## Pasos para Aplicar la Migración

### Opción 1: Panel de Supabase (Recomendado)

1. Abre el panel de Supabase: https://supabase.com/dashboard
2. Ve a tu proyecto `mroqjenlvgncutnfrjnr`
3. Navega a **SQL Editor**
4. Crea una nueva query y pega el siguiente SQL:

```sql
-- Agregar columnas bedtime y wake_time a oura_log
ALTER TABLE oura_log
ADD COLUMN IF NOT EXISTS bedtime TIME,
ADD COLUMN IF NOT EXISTS wake_time TIME;

-- Agregar comentarios para documentación
COMMENT ON COLUMN oura_log.bedtime IS 'Time when user went to bed (HH:MM format)';
COMMENT ON COLUMN oura_log.wake_time IS 'Time when user woke up (HH:MM format)';
```

5. Ejecuta la query (botón **Run**)
6. Verifica que se completó exitosamente

### Opción 2: CLI de Supabase

```bash
npx supabase db push
```

## Después de la Migración

1. **Sincroniza tus datos de Oura**: Ve a la pestaña Oura y haz click en el botón de sincronización
2. **Verifica los datos**: Los horarios promedio de sueño deberían aparecer ahora
3. **Revisa el Dashboard**: El gap comida-cama debería mostrar valores correctos

## Notas Técnicas

- Los archivos ya actualizados:
  - ✅ `supabase-schema.sql` - Schema actualizado
  - ✅ `src/types/supabase.ts` - Tipos TypeScript actualizados
  - ✅ `src/lib/mappers.ts` - Mappers actualizados para guardar/leer bedtime y wakeTime
  - ✅ `src/utils/ouraMappers.ts` - Ya estaba mapeando estos campos desde la API

- Los campos se guardan en formato TIME (HH:MM:SS)
- Los mappers de Oura ya extraen estos campos de la API de Oura
- El cálculo de promedios funciona correctamente en `OuraTab.tsx`
- El análisis de meal timing usa estos campos en `useMealTimingAnalytics.tsx`
