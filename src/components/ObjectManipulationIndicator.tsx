interface ObjectManipulationIndicatorProps {
  rotation: number;
  scale: number;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const ObjectManipulationIndicator = ({ 
  rotation, 
  scale, 
  position, 
  isVisible 
}: ObjectManipulationIndicatorProps) => {
  if (!isVisible) return null;

  const rotationDegrees = ((rotation * 180) / Math.PI).toFixed(1);

  return (
    <div
      className="fixed pointer-events-none z-50 animate-fade-in"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, calc(-100% - 20px))',
      }}
    >
      <div className="glass-panel px-4 py-2 rounded-lg border border-primary/50">
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rotation:</span>
            <span className="text-primary font-semibold">{rotationDegrees}°</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Scale:</span>
            <span className="text-accent font-semibold">{scale.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
