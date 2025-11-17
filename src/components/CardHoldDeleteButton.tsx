import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface CardHoldDeleteButtonProps {
  position: { x: number; y: number };
  onDelete: () => void;
  handPosition: { x: number; y: number } | null;
  isPinching: boolean;
}

export const CardHoldDeleteButton = ({
  position,
  onDelete,
  handPosition,
  isPinching,
}: CardHoldDeleteButtonProps) => {
  const isHovered = handPosition
    ? Math.abs(handPosition.x - position.x) < 80 && 
      Math.abs(handPosition.y - (position.y + 100)) < 50
    : false;

  // Detect pinch gesture on the delete button
  const lastPinchRef = React.useRef(false);
  
  React.useEffect(() => {
    if (isHovered && isPinching && !lastPinchRef.current) {
      onDelete();
    }
    lastPinchRef.current = isPinching;
  }, [isHovered, isPinching, onDelete]);

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 100}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <Button
        variant={isHovered ? 'destructive' : 'outline'}
        size="lg"
        onClick={onDelete}
        className={`
          transition-all duration-200 text-base px-6 py-6
          ${isHovered ? 'scale-110 shadow-lg' : 'scale-100'}
        `}
      >
        <Trash2 className="w-6 h-6 mr-2" />
        Delete
      </Button>
    </div>
  );
};
