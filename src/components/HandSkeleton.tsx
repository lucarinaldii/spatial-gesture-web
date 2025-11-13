import { useRef, useEffect } from 'react';

interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], // Palm
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
      
      // Draw connections with cyan glow - MUCH THICKER
      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 6;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00D9FF';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];

        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      });

      // Draw landmark points with purple glow - MUCH LARGER
      ctx.shadowColor = '#FF44DD';
      ctx.shadowBlur = 30;
      
      hand.forEach((landmark: any, index: number) => {
        // Make fingertips larger and brighter
        const isFingertip = [4, 8, 12, 16, 20].includes(index);
        const radius = isFingertip ? 15 : 10;
        
        ctx.fillStyle = isFingertip ? '#FF44DD' : '#B644FF';
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          radius,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
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
