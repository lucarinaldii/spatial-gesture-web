import React from 'react';
import { Circle } from 'lucide-react';

interface CardConnectorProps {
  position: 'left' | 'right' | 'top' | 'bottom';
  isActive?: boolean;
  isHovered?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const CardConnector: React.FC<CardConnectorProps> = ({
  position,
  isActive = false,
  isHovered = false,
  onMouseDown,
}) => {
  const positionStyles = {
    left: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  };

  return (
    <div
      className={`absolute ${positionStyles[position]} cursor-pointer z-10`}
      onMouseDown={onMouseDown}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`
          w-6 h-6 rounded-full border-2 transition-all duration-200
          ${isActive ? 'bg-primary border-primary scale-125 shadow-lg shadow-primary/50' : 'bg-background border-primary/50'}
          ${isHovered ? 'scale-150 border-primary bg-primary/20' : ''}
        `}
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
        )}
      </div>
    </div>
  );
};

export default CardConnector;
