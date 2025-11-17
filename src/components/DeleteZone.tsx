import { Trash2 } from 'lucide-react';

interface DeleteZoneProps {
  isActive: boolean;
  isHovering: boolean;
}

export const DeleteZone = ({ isActive, isHovering }: DeleteZoneProps) => {
  if (!isActive) return null;

  return (
    <div
      className="fixed bottom-0 left-0 w-64 h-64 pointer-events-none transition-all duration-300"
      style={{
        background: isHovering
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.6) 50%, rgba(185, 28, 28, 0.4) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 50%, rgba(185, 28, 28, 0.1) 100%)',
        borderTopRightRadius: '100%',
      }}
    >
      <div className="absolute bottom-8 left-8 flex items-center justify-center">
        <Trash2
          className={`transition-all duration-300 ${
            isHovering ? 'w-16 h-16 text-white' : 'w-12 h-12 text-red-400'
          }`}
        />
      </div>
    </div>
  );
};
