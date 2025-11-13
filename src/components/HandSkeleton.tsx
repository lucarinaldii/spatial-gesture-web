import { useRef, useEffect } from 'react';

interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
}

// Only draw essential connections for performance
const HAND_CONNECTIONS = [
  [0, 5], [5, 8], // Index finger simplified
  [0, 17], // Palm base to pinky base
];

const HandSkeleton = ({ landmarks, videoWidth, videoHeight }: HandSkeletonProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) {
      // Clear canvas if no landmarks
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Drawing hand skeleton with', landmarks.length, 'hands');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Flip context horizontally to match mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    landmarks.forEach((hand: any) => {
      console.log('Hand has', hand.length, 'landmarks');
      
      // Draw connections with cyan glow - minimal for performance
      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00D9FF';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];

        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      });

      // Draw only essential points - index tip for performance
      ctx.shadowColor = '#FF44DD';
      ctx.shadowBlur = 15;
      
      // Only index tip
      const indexTip = hand[8];
      ctx.fillStyle = '#FF44DD';
      ctx.beginPath();
      ctx.arc(
        indexTip.x * canvas.width,
        indexTip.y * canvas.height,
        10,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    
    ctx.restore();
  }, [landmarks, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};

export default HandSkeleton;
