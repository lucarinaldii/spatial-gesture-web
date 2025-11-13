import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { HandPosition, GestureState } from '@/hooks/useHandTracking';

interface InteractiveCardProps {
  title: string;
  description: string;
  position: { x: number; y: number };
  handPosition: HandPosition | null;
  gestureState: GestureState;
  onInteract: () => void;
  isBeingDragged?: boolean;
}

const InteractiveCard = ({
  title,
  description,
  position,
  handPosition,
  gestureState,
  onInteract,
  isBeingDragged = false,
}: InteractiveCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastPinchState = useRef(false);

  useEffect(() => {
    if (!handPosition || !cardRef.current) {
      setIsHovered(false);
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const handX = handPosition.x * window.innerWidth;
    const handY = handPosition.y * window.innerHeight;

    const isInBounds =
      handX >= rect.left &&
      handX <= rect.right &&
      handY >= rect.top &&
      handY <= rect.bottom;

    setIsHovered(isInBounds);

    // Detect pinch gesture within card bounds
    if (isInBounds && gestureState.isPinching && !lastPinchState.current) {
      onInteract();
      setWasClicked(true);
      setTimeout(() => setWasClicked(false), 300);
    }

    lastPinchState.current = gestureState.isPinching;
  }, [handPosition, gestureState, onInteract]);

  return (
    <div
      ref={cardRef}
      className="absolute transition-transform duration-300"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`,
      }}
    >
      <Card
        className={`
          glass-panel p-6 w-64 transition-all duration-300
          ${isHovered ? 'neon-glow border-primary' : 'border-border/30'}
          ${wasClicked ? 'scale-95' : ''}
          ${isBeingDragged ? 'shadow-2xl scale-110 cursor-grabbing' : 'cursor-pointer'}
        `}
      >
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {isHovered && (
          <div className="mt-3 text-xs font-mono text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {gestureState.isPinching ? (isBeingDragged ? 'DRAGGING...' : 'CLICKING...') : 'PINCH TO GRAB'}
          </div>
        )}
      </Card>
    </div>
  );
};

export default InteractiveCard;
