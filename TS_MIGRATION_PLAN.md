# Plan Maestro de Migración a TypeScript

Este documento detalla, paso a paso, los prompts necesarios para migrar la aplicación "Nutrition Tracker" de JavaScript a TypeScript de forma incremental, segura y cubriendo el 100% del código (Frontend, Servicios y API).

**Instrucción de uso:** Copia y pega cada bloque de prompt en el chat de tu asistente de IA. No avances al siguiente prompt hasta que el anterior se haya completado exitosamente y hayas verificado que la aplicación sigue funcionando (`npm run dev`).

---

## Fase 1: Cimientos y Configuración

### Prompt 1: Configuración del Entorno

> "Quiero iniciar la migración a Typescript.
>
> 1. Instala las dependencias de desarrollo necesarias: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
> 2. Crea un archivo `tsconfig.json` tolerante configurado para trabajar con Vite + React. Asegúrate de poner `"allowJs": true`, `"noEmit": true` y `"moduleResolution": "bundler"` para que mi código JS actual siga funcionando sin errores bloqueantes.
> 3. Renombra solo el archivo `vite.config.js` a `vite.config.ts` y arréglalo si es necesario para confirmar que el entorno soporta TS.
> 4. Verifica que `npm run dev` siga levantando la app correctamente."

## Fase 2: Definición de Datos y Lógica Core

### Prompt 2: Tipos de Supabase (El Contrato)

> "Revisa la carpeta `src/lib`. Veo que existe un archivo `database.types.js` (o similar).
>
> 1. Crea una carpeta `src/types` y dentro un archivo de definición `supabase.ts`.
> 2. Basa estos tipos en la estructura actual de mi base de datos. Define interfaces claras para las tablas principales: `profiles`, `food_log`, `workouts`, `meal_templates`.
> 3. Migra `src/lib/supabase.js` a `.ts`. Tipa el cliente de Supabase usando `Database` generada para tener autocompletado en todas las consultas."

### Prompt 3: Lógica Pura y Servicios (El Motor)

> "Vamos a migrar la lógica de negocio que no depende de React.
>
> 1. Convierte a TypeScript todos los archivos en `src/utils` y `src/constants`. Asegúrate de tipar los argumentos y retornos de las funciones.
> 2. Convierte la carpeta `src/services` (incluyendo `weatherService.js`, `ai/`, etc.). Presta especial atención a tipar las respuestas de las APIs externas y las funciones asíncronas."

## Fase 3: Capa de Datos y Estado

### Prompt 4: Hooks de Base de Datos

> "Migra los hooks de acceso a datos en `src/hooks/supabase/` (ej: `useProfileData`, `useNutritionData`, etc.).
>
> 1. Renombra los archivos a `.ts` (o `.tsx` si usan hooks de React).
> 2. Define interfaces explícitas para el objeto que retorna cada hook.
> 3. Usa los tipos de Supabase creados en el paso 2 para asegurar que los datos que fluyen por la app estén tipados correctamente."

### Prompt 5: Contexto Global (El Sistema Nervioso)

_Nota: Este paso es crítico ya que afecta a toda la app._

> "Migra el contexto principal `src/context/TrackerContext.jsx` a `.tsx`.
>
> 1. Define una interfaz `TrackerContextType` exhaustiva que describa todas las funciones, estados y valores que el contexto provee.
> 2. Tipa correctamente el componente `Provider` y sus `children`.
> 3. Asegúrate de que los valores iniciales/por defecto coincidan con los tipos definidos para evitar errores en tiempo de ejecución."

## Fase 4: Interfaz de Usuario (De abajo hacia arriba)

### Prompt 6: Hooks de UI y Facade

> "Migra el resto de la carpeta `src/hooks`, incluyendo el hook principal `useSupabase.js` (el facade).
>
> 1. Renombra a `.tsx`.
> 2. Asegúrate de que las importaciones de los hooks ya migrados (paso 4) funcionen correctamente con sus nuevos tipos.
> 3. Tipa cualquier hook de UI restante (ej: `useWindowSize`, `useScroll`, etc.)."

### Prompt 7: Componentes UI Atómicos (Los Ladrillos)

> "Migra los componentes de presentación más pequeños.
>
> 1. Enfócate en `src/components/UI`, `src/components/Charts` y `src/components/Food`.
> 2. Para cada componente, define una `interface Props` clara.
> 3. Elimina `prop-types` si existen, ya que TypeScript los hace redundantes.
> 4. Asegúrate de que los gráficos (Recharts) tengan sus datos tipados correctamente."

### Prompt 8: Vistas Principales y Dashboard

> "Migra los componentes complejos de `src/components/Dashboard` y `src/components/Tabs`.
>
> 1. Convierte `DashboardTab.jsx` y sus tarjetas principales a `.tsx`.
> 2. Soluciona cualquier error de tipado que surja al conectar estos componentes con el `TrackerContext` (ya migrado) y los Hooks.
> 3. Verifica que la interacción con los eventos del DOM (onClick, onChange) esté correctamente tipada."

## Fase 5: Backend y Limpieza Final

### Prompt 9: Serverless Functions

> "Revisa la carpeta `api/` en la raíz del proyecto.
>
> 1. Renombra los archivos `.js` a `.ts`.
> 2. Tipa los objetos `Request` y `Response` (usando tipos estándar de `Request`/`Response` o los de Vercel si aplica).
> 3. Asegúrate de que la configuración de TS incluya o excluya esta carpeta según sea necesario para que no interfiera con el build de Vite."

### Prompt 10: Barrido Final y Modo Estricto

> "Finalicemos la migración para llegar al 100%.
>
> 1. Migra el punto de entrada `src/main.jsx` a `.tsx`.
> 2. Busca recursivamente cualquier archivo `.js` o `.jsx` que haya quedado olvidado en `src/` y migrálo.
> 3. Actualiza `tsconfig.json`: cambia `"allowJs"` a `false`.
> 4. Ejecuta `npx tsc` en la terminal y corrige cualquier error residual que aparezca.
> 5. Confirma que la app compila y corre perfectamente (`npm run build` y `npm run dev`)."
