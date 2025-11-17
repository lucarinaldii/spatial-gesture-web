import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardHoldDeleteButtonProps {
  position: { x: number; y: number };
  onDelete: () => void;
  handPosition: { x: number; y: number } | null;
}

export const CardHoldDeleteButton = ({
  position,
  onDelete,
  handPosition,
}: CardHoldDeleteButtonProps) => {
  const isHovered = handPosition
    ? Math.abs(handPosition.x - position.x) < 50 && 
      Math.abs(handPosition.y - (position.y + 80)) < 30
    : false;

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 80}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <Button
        variant={isHovered ? 'destructive' : 'outline'}
        size="sm"
        onClick={onDelete}
        className={`
          transition-all duration-200
          ${isHovered ? 'scale-110 shadow-lg' : 'scale-100'}
        `}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  );
};
