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
        className={`relative -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
          gestureState.isPinching ? 'scale-90' : 'scale-100'
        }`}
      >
        {/* Hand Silhouette SVG */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          className={`transition-all duration-200 ${
            gestureState.isPinching
              ? 'drop-shadow-[0_0_20px_hsl(var(--secondary))]'
              : 'drop-shadow-[0_0_15px_hsl(var(--primary))]'
          }`}
          style={{
            filter: gestureState.isPinching 
              ? 'drop-shadow(0 0 20px hsl(var(--secondary)))' 
              : 'drop-shadow(0 0 15px hsl(var(--primary)))'
          }}
        >
          {gestureState.isPinching ? (
            // Closed/Grabbing Hand
            <g fill={`hsl(var(--secondary))`} opacity="0.9">
              {/* Palm */}
              <ellipse cx="50" cy="60" rx="20" ry="25" />
              
              {/* Thumb (curved in) */}
              <path d="M 35 55 Q 30 50 28 45 Q 27 42 29 40 Q 31 38 34 40 Q 36 42 35 45 Q 34 50 35 55 Z" />
              
              {/* Index finger (curled) */}
              <path d="M 45 40 Q 43 35 43 30 Q 43 27 45 26 Q 47 25 49 27 Q 50 29 50 32 Q 50 37 48 40 Z" />
              
              {/* Middle finger (curled) */}
              <path d="M 52 38 Q 51 33 51 28 Q 51 25 53 24 Q 55 23 57 25 Q 58 27 58 30 Q 58 35 56 38 Z" />
              
              {/* Ring finger (curled) */}
              <path d="M 60 40 Q 59 35 59 31 Q 59 28 61 27 Q 63 26 65 28 Q 66 30 66 33 Q 66 37 64 40 Z" />
              
              {/* Pinky (curled) */}
              <path d="M 68 45 Q 67 41 67 38 Q 67 36 69 35 Q 71 34 73 36 Q 74 38 74 40 Q 74 43 72 45 Z" />
            </g>
          ) : (
            // Open Hand
            <g fill={`hsl(var(--primary))`} opacity="0.85">
              {/* Palm */}
              <ellipse cx="50" cy="65" rx="22" ry="28" />
              
              {/* Thumb */}
              <path d="M 30 60 Q 20 55 15 45 Q 12 40 13 35 Q 14 30 18 28 Q 22 26 26 30 Q 28 33 28 38 Q 28 48 30 60 Z" />
              
              {/* Index finger */}
              <path d="M 42 45 Q 40 30 40 15 Q 40 10 43 8 Q 46 6 49 8 Q 52 10 52 15 Q 52 30 50 45 Z" />
              
              {/* Middle finger */}
              <path d="M 50 43 Q 49 28 49 10 Q 49 5 52 3 Q 55 1 58 3 Q 61 5 61 10 Q 61 28 60 43 Z" />
              
              {/* Ring finger */}
              <path d="M 58 45 Q 57 30 57 18 Q 57 13 60 11 Q 63 9 66 11 Q 69 13 69 18 Q 69 30 68 45 Z" />
              
              {/* Pinky */}
              <path d="M 66 50 Q 65 38 65 28 Q 65 24 68 22 Q 71 20 74 22 Q 77 24 77 28 Q 77 38 76 50 Z" />
            </g>
          )}
        </svg>

        {/* Hand label */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className={`text-xs font-mono ${
            gestureState.isPinching ? 'text-secondary' : 'text-primary'
          }`}>
            {gestureState.handIndex === 0 ? 'LEFT' : 'RIGHT'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandCursor;
