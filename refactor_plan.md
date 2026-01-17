Arquitectura de Refactorización: Descomposición de NutritionTracker (Fase 5)
🎯 Objetivo
Transformar 
NutritionTracker.jsx
 de un "God Component" (Controlador + UI + Lógica) a un orquestador limpio, separando responsabilidades en sub-componentes y contextos.

🗺️ Mapa de Descomposición
1. Estado Global Identificado
El estado reside principalmente en 
useTrackerData.js
 y se puede categorizar en:

Datos de Dominio: user, profile, foodLog, workoutLog, weightHistory, stepsLog.
Estado de UI Global: activeTab, isRefreshing, isLoading.
UI Efímera Global: modals (delete, import, forms), undoAction (toast), fab visibility.
Sync State: saveStatus, offlineMode, migrationData.
Funciones Modificadoras Principales:

sync/*: 
forceSyncToCloud
, 
handleRefresh
.
crud/*: 
addWeightEntry
, 
upsertFood
, 
executeDelete
.
2. Propuesta de Sub-Componentes Lógicos (Nuevos)
Componente	Responsabilidad	Complejidad
TrackerHeader	Renderiza el logo, estado de sincronización (nube/offline), y resumen de peso. Aísla la lógica de visualización del header.	Alta (Props: user, syncStatus, weight)
ModalsManager	Contenedor que renderiza condicionalmente todos los modales globales (DeleteConfirm, FoodForm, 
Import
, etc) para limpiar el JSX principal.	Media
TrackerContext	(Crucial) Provider que envuelve la app y expone el returnValue de 
useTrackerData
. Elimina el "prop drilling" masivo.	Alta
LoadingScreen	Componente visual puro para el estado de carga inicial ("Cargando datos...").	Baja
UndoToast	Componente flotante para la acción de "Deshacer".	Baja
AuthWrapper	Maneja la lógica de mostrar AuthUI, 
Onboarding
 o el contenido principal.	Media
3. Estructura de Carpetas Propuesta
src/
├── context/
│   └── TrackerContext.jsx      <-- Nuevo Provider
├── components/
│   ├── layout/
│   │   ├── Header/             <-- TrackerHeader
│   │   ├── Modals/             <-- ModalsManager
│   │   └── Shell/              <-- AuthWrapper, LoadingScreen
│   ├── features/               <-- Dominios específicos si crecen
│   └── shared/                 <-- UndoToast
4. Orden de Extracción (Plan de Acción)
Para minimizar riesgos, procederemos en este orden:

Paso 1: Extracción Visual (Sin cambiar lógica de estado)
Extraer LoadingScreen (Fácil).
Extraer UndoToast (Fácil).
Extraer TrackerHeader (Requiere pasar varias props, pero limpia ~100 líneas).
Paso 2: Agrupación de Modales
Crear ModalsManager. Mover todos los bloques {showModal && <Modal ... />} a este componente.
Esto reducirá drásticamente el ruido visual al final del 
NutritionTracker.jsx
.
Paso 3: Context API (El cambio estructural)
Crear TrackerContext.jsx.
Mover la instanciación de 
useTrackerData
, 
useDataOperations
, 
useAnalytics
, etc., dentro de este Provider.
Envolver 
NutritionTracker
 con TrackerProvider.
Reemplazar props drilling con 
useTracker()
 en los componentes hijos (DashboardTab, DiaryTab, etc.).
Paso 4: Limpieza Final de 
NutritionTracker.jsx
El componente principal solo debería contener: <TrackerProvider> <AuthWrapper> <MainLayout /> ... </AuthWrapper> </TrackerProvider>.
⚠️ Puntos Críticos
Dependencias Circulares: Al mover lógica a Context, asegurar que los hooks no dependan de funciones que aún no estén en el contexto.
Performance: TrackerContext podría causar re-renders excesivos si no se memoriza bien el value. Se usará useMemo en el Provider.
