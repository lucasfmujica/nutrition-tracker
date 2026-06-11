import { useEffect, useRef } from 'react';

/**
 * useModalA11y - Basic accessibility behavior for modal dialogs.
 *
 * - Closes the modal on Escape
 * - Moves focus into the modal container when it opens
 * - Restores focus to the previously focused element when it closes
 *
 * Usage: attach the returned ref to the modal panel element and give it
 * tabIndex={-1} so it can receive programmatic focus.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current =
            (document.activeElement as HTMLElement | null) ?? null;

        // Focus the modal panel (next frame, after it renders)
        const focusFrame = requestAnimationFrame(() => {
            modalRef.current?.focus();
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus to the trigger element
            previousFocusRef.current?.focus?.();
        };
    }, [isOpen]);

    return modalRef;
}
