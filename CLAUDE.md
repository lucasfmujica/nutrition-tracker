# Guía de Desarrollo LukenFit

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
