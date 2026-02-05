import React, { useState } from 'react';

interface UserAvatarProps {
    src: string | null | undefined;
    name: string;
    className?: string; // Should include w-X h-X
    textSize?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    name,
    className = 'w-10 h-10',
    textSize = 'text-sm',
}) => {
    const [error, setError] = useState(false);

    // If src is a short string (likely an emoji), render it as text
    if (src && src.length <= 4 && !src.startsWith('http')) {
        return (
            <div
                className={`${className} rounded-full bg-surface-lighter flex items-center justify-center text-2xl border-2 border-white shadow-sm ring-1 ring-border`}>
                {src}
            </div>
        );
    }

    // If src exists (is a URL) and no error has occurred, try to show the image
    if (src && !error) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setError(true)}
                className={`${className} rounded-full object-cover border-2 border-white shadow-sm`}
            />
        );
    }

    // Fallback gradient with initials
    return (
        <div
            className={`${className} rounded-full bg-gradient-to-tr from-primary/80 to-cyan-400 flex items-center justify-center text-white font-bold shadow-sm ${textSize}`}>
            {name ? name.charAt(0).toUpperCase() : '?'}
        </div>
    );
};
