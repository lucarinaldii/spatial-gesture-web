import { useState, useRef, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { HandPosition, GestureState } from '@/hooks/useHandTracking';

interface InteractiveCardProps {
  title: string;
  description: string;
  position: { x: number; y: number };
  rotation: { x: number; y: number; z: number };
  zIndex: number;
  handPosition: HandPosition | null;
  gestureState: GestureState;
  onInteract: () => void;
  isBeingDragged?: boolean;
  scale?: number;
  isShaking?: boolean;
}

const InteractiveCard = memo(({
  title,
  description,
  position,
  rotation,
  zIndex,
  handPosition,
  gestureState,
  onInteract,
  isBeingDragged = false,
  scale = 1,
  isShaking = false,
}: InteractiveCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
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
      setShowAddedFeedback(true);
      setTimeout(() => setWasClicked(false), 150);
      setTimeout(() => setShowAddedFeedback(false), 800);
    }

    lastPinchState.current = gestureState.isPinching;
  }, [handPosition, gestureState, onInteract, isBeingDragged]);

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        perspective: '1200px',
        zIndex,
      }}
    >
      <div
        ref={cardRef}
        className={`will-change-transform ${isShaking ? 'animate-shake' : ''}`}
        style={{
          transform: isShaking ? undefined : `translate(-50%, -50%) scale(${scale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transformStyle: 'preserve-3d',
          transition: isBeingDragged || isShaking ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <Card
          className={`
            glass-panel p-6 w-64 transition-all duration-200 relative
            ${isHovered ? 'border-primary' : 'border-border/30'}
            ${wasClicked ? 'scale-95' : ''}
            ${isBeingDragged ? 'scale-110 ring-2 ring-primary' : ''}
          `}
          style={{
            backfaceVisibility: 'hidden',
            ...(showAddedFeedback ? { boxShadow: 'inset 0 0 0 4px rgb(34 197 94)' } : {})
          }}
        >
          <div className={`transition-opacity duration-300 ${showAddedFeedback ? 'opacity-20' : 'opacity-100'}`}>
            <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          {showAddedFeedback && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-50"></div>
                <div className="relative text-4xl text-green-500 font-bold">✓</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});

InteractiveCard.displayName = 'InteractiveCard';

export default InteractiveCard;
