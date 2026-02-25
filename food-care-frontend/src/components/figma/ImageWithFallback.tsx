import { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
    src?: string;
    alt?: string;
    className?: string;
    fallbackSrc?: string;
}

export function ImageWithFallback({
    src,
    alt = "",
    className = '',
    fallbackSrc = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
}: ImageWithFallbackProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [_hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
        setIsLoading(true);
    }, [src]);

    const handleError = () => {
        // If we are already on the fallback, or simply cannot load the current src
        if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
            setHasError(true);
            // Keep loading true, as we are now loading the fallback
        } else {
            // Fallback also failed (or src was equal to fallback)
            setIsLoading(false); // Stop pulse animation so we show the broken image icon or alt text
        }
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onError={handleError}
                onLoad={handleLoad}
            />
        </div>
    );
}
