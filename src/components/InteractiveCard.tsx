import { useState, useRef, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { HandPosition, GestureState } from '@/hooks/useHandTracking';

interface InteractiveCardProps {
  title: string;
  description: string;
  position: { x: number; y: number };
  zIndex: number;
  handPosition: HandPosition | null;
  gestureState: GestureState;
  onInteract: () => void;
  isBeingDragged?: boolean;
  scale?: number;
}

const InteractiveCard = memo(({
  title,
  description,
  position,
  zIndex,
  handPosition,
  gestureState,
  onInteract,
  isBeingDragged = false,
  scale = 1,
}: InteractiveCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastPinchState = useRef(false);

  useEffect(() => {
    if (!handPosition || !cardRef.current || isBeingDragged) {
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
  }, [handPosition, gestureState, onInteract, isBeingDragged]);

  return (
    <div
      ref={cardRef}
      className="absolute will-change-transform"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: isBeingDragged ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex,
      }}
    >
      <Card
        className={`
          glass-panel p-6 w-64 transition-all duration-200
          ${isHovered ? 'border-primary' : 'border-border/30'}
          ${wasClicked ? 'scale-95' : ''}
          ${isBeingDragged ? 'scale-110 ring-2 ring-primary' : ''}
        `}
      >
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
});

InteractiveCard.displayName = 'InteractiveCard';

export default InteractiveCard;
