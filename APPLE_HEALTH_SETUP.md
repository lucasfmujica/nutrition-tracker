# Apple Health → LukenFit (vía Atajo de iOS)

Como LukenFit es una PWA, no puede leer HealthKit directamente. La integración
usa un **Atajo de iOS** que lee Apple Health cada noche y hace un POST a
`/api/sync-health`.

## Endpoint

```
POST https://<tu-dominio-vercel>/api/sync-health
Content-Type: application/json
```

### Body recomendado (batch)

```json
{
  "syncToken": "<SYNC_TOKEN>",
  "date": "2026-06-11",
  "metrics": {
    "steps": 8421,
    "weight": 78.4,
    "sleep": { "hours": 7.5, "bedtime": "23:40", "wakeTime": "07:10" },
    "workouts": [
      { "name": "Functional Strength Training", "type": "gym",
        "duration": 45, "calories": 320, "date": "2026-06-11" }
    ]
  }
}
```

- Cualquier campo de `metrics` puede omitirse.
- `date` acepta `YYYY-MM-DD` o ISO 8601 (se convierte a día de Argentina). Si falta, se usa hoy.
- También sigue funcionando el formato legado `{ "type": "weight"|"steps", "value": ..., "date": ... }`.
- Autenticación: token personal `syncToken`, firmado por el servidor y vinculado al usuario autenticado.
- En el front, la sección **Apple Health** de Config muestra la URL y el token para copiar.
  `SYNC_API_KEY` existe solamente en Vercel y nunca se incluye en el bundle del navegador.

### Reglas de dedupe (la sync nunca pisa datos)

| Métrica  | Destino          | Regla |
|----------|------------------|-------|
| steps    | `steps_log`      | Solo escribe si no hay entrada del día o si la existente ya es `source='ios-health'`. Manual y Oura siempre ganan. |
| weight   | `weight_history` | Solo inserta si no hay entrada del día (la tabla no tiene columna source). |
| workouts | `workouts`       | Marcados con `[apple_health]` en `notes`. Se saltea si ya existe un workout con misma fecha + nombre. |
| sleep    | `oura_log`       | Solo inserta si no hay fila del día (los datos de Oura son más ricos y ganan). |

La respuesta es `{ success, date, results: [{ metric, status: synced|skipped|error, reason }] }`.

## Paso a paso: crear el Atajo

1. Abrí **Atajos** en el iPhone → `+` para crear un atajo nuevo (nombre: "Sync LukenFit").
2. Agregá **Buscar muestras de salud** (Find Health Samples):
   - **Pasos**: tipo "Pasos", filtrado a "Hoy", agrupado/calculado como **Suma**.
   - **Peso**: tipo "Peso", ordenado por fecha más reciente, **límite 1**.
   - (Opcional) **Sueño**: tipo "Sueño / Análisis de sueño" de anoche, sumando horas dormidas.
   - (Opcional) **Entrenos**: acción "Buscar entrenamientos" de hoy; del resultado usá nombre/tipo, duración (min) y calorías activas.
3. Agregá **Obtener contenido de URL** (Get Contents of URL):
   - URL: `https://<tu-dominio>/api/sync-health`
   - Método: **POST**, Cuerpo de la solicitud: **JSON**.
   - Armá los campos `syncToken`, `date` (variable "Fecha actual" en formato ISO) y el diccionario `metrics` con las variables mágicas de los pasos anteriores. Copiá el token desde Config → Apple Health en la app.
4. Ejecutá el atajo una vez a mano y dale permiso de lectura de Salud. La respuesta debe incluir `"success": true`.
5. Pestaña **Automatización** → `+` → **Automatización personal** → **Hora del día** (ej. 23:30, todos los días) → **Ejecutar atajo** → elegí "Sync LukenFit" → desactivá **Pedir confirmación**.

> Tip: no existe forma soportada de distribuir un `.shortcut` firmado con variables del usuario; por eso el setup es manual con copy/paste de URL y token.

## Notas

- Los pasos llegan con `source: 'ios-health'` (el CHECK de `steps_log` admite `manual | oura | ios-health`; no se requiere migración).
- La fecha de "última sincronización" en Config usa como proxy la última entrada de `steps_log` con `source='ios-health'`.
