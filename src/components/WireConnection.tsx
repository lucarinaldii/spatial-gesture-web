import React from 'react';

interface WireConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive?: boolean;
}

export const WireConnection: React.FC<WireConnectionProps> = ({
  startX,
  startY,
  endX,
  endY,
  isActive = false,
}) => {
  // Calculate control points for a smooth curve
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Make curve more pronounced based on distance
  const curvature = Math.min(distance * 0.3, 100);
  
  // Control points for cubic bezier
  const cp1x = startX + curvature;
  const cp1y = startY;
  const cp2x = endX - curvature;
  const cp2y = endY;
  
  const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 0 }}
    >
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="6"
        opacity="0.3"
      />
      {/* Main wire */}
      <path
        d={path}
        fill="none"
        stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default WireConnection;
