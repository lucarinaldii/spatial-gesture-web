import { useEffect, useRef } from 'react';
import { HandPosition, GestureState } from '../types';

export interface HandCursorProps {
  position: HandPosition | null;
  gestureState: GestureState;
  className?: string;
}

export const HandCursor = ({ position, gestureState, className = '' }: HandCursorProps) => {
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
      className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ${className}`}
      style={{ willChange: 'transform' }}
    >
      <div
        className={`relative -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
          gestureState.isPinching ? 'scale-110' : 'scale-130'
        }`}
      >
        <svg
          width="104"
          height="104"
          viewBox="0 0 100 100"
          className="transition-all duration-200"
          style={{
            filter: gestureState.isPinching 
              ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))' 
              : 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4))',
            transform: gestureState.handIndex === 1 ? 'scaleX(-1)' : undefined
          }}
        >
          {gestureState.isPinching ? (
            <g fill="white" opacity="0.95">
              <rect x="35" y="50" width="30" height="35" rx="8" />
              <ellipse cx="30" cy="60" rx="8" ry="15" transform="rotate(-20 30 60)" />
              <ellipse cx="42" cy="45" rx="6" ry="12" />
              <ellipse cx="50" cy="43" rx="6" ry="13" />
              <ellipse cx="58" cy="45" rx="6" ry="12" />
              <ellipse cx="65" cy="48" rx="5" ry="10" />
              <rect x="38" y="50" width="5" height="8" rx="2" opacity="0.3" />
              <rect x="47" y="50" width="5" height="8" rx="2" opacity="0.3" />
              <rect x="56" y="50" width="5" height="8" rx="2" opacity="0.3" />
            </g>
          ) : (
            <g fill="white" opacity="0.9">
              <path d="M 32 85 L 32 55 Q 32 50 37 50 L 63 50 Q 68 50 68 55 L 68 85 Q 68 90 63 90 L 37 90 Q 32 90 32 85 Z" />
              <path d="M 32 65 L 25 62 Q 18 60 14 55 Q 12 52 12 48 Q 12 44 15 42 Q 18 40 22 42 L 30 50 Q 32 52 32 55 Z" />
              <rect x="36" y="15" width="8" height="40" rx="4" />
              <rect x="46" y="10" width="8" height="45" rx="4" />
              <rect x="56" y="15" width="8" height="40" rx="4" />
              <rect x="66" y="22" width="7" height="33" rx="3.5" />
              <ellipse cx="40" cy="52" rx="3" ry="4" opacity="0.2" />
              <ellipse cx="50" cy="52" rx="3" ry="4" opacity="0.2" />
              <ellipse cx="60" cy="52" rx="3" ry="4" opacity="0.2" />
              <ellipse cx="69" cy="53" rx="2.5" ry="3" opacity="0.2" />
            </g>
          )}
        </svg>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className={`text-xs font-mono font-bold ${
            gestureState.isPinching ? 'text-white' : 'text-white/70'
          }`}>
            {gestureState.handIndex === 0 ? 'R' : 'L'}
          </div>
        </div>
      </div>
    </div>
  );
};
