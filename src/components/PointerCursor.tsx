import { useEffect, useRef } from 'react';

interface PointerCursorProps {
  x: number;
  y: number;
  isPinching: boolean;
}

const PointerCursor = ({ x, y, isPinching }: PointerCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, [x, y]);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75"
      style={{ willChange: 'transform' }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        {/* Outer ring */}
        <div 
          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
            isPinching 
              ? 'border-primary bg-primary/30 scale-75' 
              : 'border-primary/70 bg-primary/10 scale-100'
          }`}
          style={{
            boxShadow: isPinching 
              ? '0 0 20px hsl(var(--primary) / 0.6)' 
              : '0 0 15px hsl(var(--primary) / 0.3)'
          }}
        />
        
        {/* Center dot */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
            isPinching ? 'w-2 h-2 bg-primary' : 'w-1.5 h-1.5 bg-primary/70'
          }`}
        />
        
        {/* Click ripple effect */}
        {isPinching && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-primary animate-ping"
            style={{ animationDuration: '0.5s' }}
          />
        )}
      </div>
    </div>
  );
};

export default PointerCursor;
