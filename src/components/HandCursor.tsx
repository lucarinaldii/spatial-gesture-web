import { useEffect, useRef } from 'react';
import { HandPosition, GestureState } from '@/hooks/useHandTracking';

interface HandCursorProps {
  position: HandPosition | null;
  gestureState: GestureState;
}

const HandCursor = ({ position, gestureState }: HandCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (position && cursorRef.current) {
      const x = position.x * window.innerWidth;
      const y = position.y * window.innerHeight;
      
      cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, [position]);

  if (!position) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75"
      style={{ willChange: 'transform' }}
    >
      <div
        className={`relative w-8 h-8 rounded-full transition-all duration-200 ${
          gestureState.isPinching
            ? 'bg-secondary scale-125 shadow-[0_0_30px_hsl(var(--secondary))]'
            : 'bg-primary shadow-[0_0_20px_hsl(var(--primary))]'
        }`}
      >
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 transition-all duration-200 ${
            gestureState.isPinching
              ? 'border-secondary scale-150 opacity-50'
              : 'border-primary scale-125 opacity-30'
          }`}
        />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              gestureState.isPinching ? 'bg-background scale-150' : 'bg-primary-foreground'
            }`}
          />
        </div>

        {/* Pinch strength indicator */}
        {gestureState.isPinching && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="text-xs font-mono text-secondary">
              PINCH
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandCursor;
