import { useState, useEffect, useRef, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper around recharts ResponsiveContainer that defers rendering
 * until the container has been mounted and has positive dimensions.
 * This prevents the "width(-1) and height(-1)" console warnings.
 */
export function ChartContainer({ children, className = 'h-72 w-full' }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use ResizeObserver to wait for positive dimensions
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setReady(true);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      )}
    </div>
  );
}
