import { useRef, useEffect } from 'react';

interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
}

// Complete hand skeleton connections (all fingers)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17],
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
    
    // Flip context horizontally to match mirrored video and scale down to match 3D model
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    // Scale down skeleton to match 3D hand size
    const scaleFactor = 0.55;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-centerX, -centerY);

    landmarks.forEach((hand: any) => {
      console.log('Hand has', hand.length, 'landmarks');
      
      // Draw connections with white opaque (thinner lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];

        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      });

      // Draw all fingertip landmarks (smaller)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      
      // Draw all fingertips: Thumb(4), Index(8), Middle(12), Ring(16), Pinky(20)
      const fingertips = [4, 8, 12, 16, 20];
      fingertips.forEach(tipIndex => {
        const tip = hand[tipIndex];
        ctx.beginPath();
        ctx.arc(
          tip.x * canvas.width,
          tip.y * canvas.height,
          3,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });

      // Draw wrist (smaller)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const wrist = hand[0];
      ctx.beginPath();
      ctx.arc(
        wrist.x * canvas.width,
        wrist.y * canvas.height,
        3,
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
