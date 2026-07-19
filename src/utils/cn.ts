/**
 * Concatena clases condicionalmente (mini-clsx, sin dependencias).
 * cn('a', cond && 'b', undefined) => 'a b'
 */
export const cn = (
    ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(' ');
