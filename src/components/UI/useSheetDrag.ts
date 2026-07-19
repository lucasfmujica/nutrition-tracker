import { useCallback, useRef } from 'react';

interface SheetDragOptions {
    /** Se invoca cuando el gesto supera el umbral de cierre. */
    onDismiss: () => void;
    /** Habilita/deshabilita el gesto (ej. solo en mobile). */
    enabled?: boolean;
}

const DISMISS_DISTANCE = 120; // px arrastrados hacia abajo
const DISMISS_VELOCITY = 0.5; // px/ms al soltar

/**
 * Drag-to-dismiss para bottom-sheets (pointer events, sin dependencias).
 * Devuelve handlers para el elemento "handle" del sheet y una ref al panel
 * que se traslada durante el gesto.
 */
export const useSheetDrag = ({ onDismiss, enabled = true }: SheetDragOptions) => {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const startY = useRef(0);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const velocity = useRef(0);
    const dragging = useRef(false);

    const setTranslate = (y: number, animate: boolean) => {
        const el = panelRef.current;
        if (!el) return;
        el.style.transition = animate ? 'transform 0.25s ease-out' : 'none';
        el.style.transform = y > 0 ? `translateY(${y}px)` : '';
    };

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!enabled) return;
            dragging.current = true;
            startY.current = e.clientY;
            lastY.current = e.clientY;
            lastTime.current = e.timeStamp;
            velocity.current = 0;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        },
        [enabled],
    );

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return;
        const delta = e.clientY - startY.current;
        const dt = e.timeStamp - lastTime.current;
        if (dt > 0) {
            velocity.current = (e.clientY - lastY.current) / dt;
        }
        lastY.current = e.clientY;
        lastTime.current = e.timeStamp;
        setTranslate(Math.max(0, delta), false);
    }, []);

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!dragging.current) return;
            dragging.current = false;
            const delta = e.clientY - startY.current;
            if (delta > DISMISS_DISTANCE || velocity.current > DISMISS_VELOCITY) {
                onDismiss();
                // Reset tras la animación de salida del modal
                setTimeout(() => setTranslate(0, false), 300);
            } else {
                setTranslate(0, true); // spring-back
            }
        },
        [onDismiss],
    );

    return {
        panelRef,
        handleProps: { onPointerDown, onPointerMove, onPointerUp },
    };
};
