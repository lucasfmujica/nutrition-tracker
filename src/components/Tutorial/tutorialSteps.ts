/**
 * Tutorial Steps Configuration
 *
 * Each step defines:
 * - id: Unique identifier
 * - title: Display title
 * - description: Explanation text
 * - target: CSS selector or 'center' for modal
 * - position: Where to show tooltip (top, bottom, left, right)
 * - action: Optional action (navigate to tab, etc.)
 * - image: Optional placeholder image path
 */

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    target: string | 'center';
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: {
        type: 'navigate';
        tab?: number;
    };
    image?: string;
}

export const tutorialSteps: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Bienvenido a LukenFit',
        description:
            'Te voy a mostrar las funciones principales de la app. Solo toma un minuto.',
        target: 'center',
        position: 'center',
        image: '/tutorial/welcome.png',
    },
    {
        id: 'dashboard-calories',
        title: 'Tu Balance de Calorías',
        description:
            'El círculo muestra cuántas calorías te quedan hoy. Verde = bien encaminado.',
        target: '[data-tutorial="calorie-ring"]',
        position: 'bottom',
        action: { type: 'navigate', tab: 0 },
    },
    {
        id: 'dashboard-macros',
        title: 'Tus Macros',
        description:
            'Proteína, carbohidratos y grasas. La proteína es la más importante para tus objetivos.',
        target: '[data-tutorial="macro-bars"]',
        position: 'top',
    },
    {
        id: 'dashboard-steps',
        title: 'Pasos del Día',
        description:
            'Tus pasos diarios. Podés sincronizarlos desde Apple Health con iOS Shortcuts.',
        target: '[data-tutorial="steps-card"]',
        position: 'top',
    },
    {
        id: 'fab-button',
        title: 'El Botón Más Importante',
        description:
            'Tocá el + para agregar comida. Es lo que más vas a usar en la app.',
        target: '[data-tutorial="fab-button"]',
        position: 'top',
        image: '/tutorial/fab-button.png',
    },
    {
        id: 'food-methods',
        title: '3 Formas de Registrar Comida',
        description:
            '1) Escribí qué comiste (IA lo analiza)\n2) Sacá una foto (IA reconoce la comida)\n3) Escaneá código de barras',
        target: 'center',
        position: 'center',
        image: '/tutorial/food-methods.png',
    },
    {
        id: 'ai-camera-tip',
        title: 'Tip: Fotos con IA',
        description:
            'Para mejores resultados, fotografiá toda la comida junta y bien iluminada.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'diary-tab',
        title: 'Tu Diario de Comidas',
        description:
            'Acá ves todo lo que comiste hoy. Podés editar o eliminar cualquier entrada.',
        target: '[data-tutorial="diary-tab"]',
        position: 'top',
        action: { type: 'navigate', tab: 1 },
    },
    {
        id: 'diary-swipe',
        title: 'Deslizar para Editar',
        description:
            'Deslizá una comida a la izquierda para editarla o eliminarla.',
        target: 'center',
        position: 'center',
        image: '/tutorial/swipe-gesture.png',
    },
    {
        id: 'weight-tab',
        title: 'Tu Progreso de Peso',
        description:
            'Registrá tu peso regularmente. La app calcula cuándo llegarás a tu meta.',
        target: '[data-tutorial="weight-tab"]',
        position: 'top',
        action: { type: 'navigate', tab: 2 },
    },
    {
        id: 'weight-prediction',
        title: 'Predicción Inteligente',
        description:
            'Basándose en tu tendencia real, la app proyecta tu fecha de llegada a la meta.',
        target: 'center',
        position: 'center',
        image: '/tutorial/weight-chart.png',
    },
    {
        id: 'workouts-tab',
        title: 'Tus Entrenamientos',
        description:
            'Los días que entrenas, tenés un bonus de calorías extra para recuperarte.',
        target: '[data-tutorial="workouts-tab"]',
        position: 'top',
        action: { type: 'navigate', tab: 3 },
    },
    {
        id: 'config-tab',
        title: 'Configuración',
        description:
            'Ajustá tus metas, configurá iOS Shortcuts, y más opciones avanzadas.',
        target: '[data-tutorial="config-tab"]',
        position: 'top',
        action: { type: 'navigate', tab: 4 },
    },
    {
        id: 'complete',
        title: '¡Listo para Empezar!',
        description:
            'Ya conocés lo esencial. Tu primer paso: registrá tu próxima comida.',
        target: 'center',
        position: 'center',
    },
];

export const getTotalSteps = () => tutorialSteps.length;
