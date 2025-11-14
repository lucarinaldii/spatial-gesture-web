import { useRef, useEffect } from 'react';
import { AlignmentParams } from './AlignmentSettings';

interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
  alignmentParams: AlignmentParams;
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

const HandSkeleton = ({ landmarks, videoWidth, videoHeight, alignmentParams }: HandSkeletonProps) => {
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
    
    // Flip context horizontally and apply skeleton-specific alignment
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    // Apply skeleton-specific alignment params
    const scaleFactor = alignmentParams.skeletonScale;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + alignmentParams.skeletonXOffset * 50, centerY + alignmentParams.skeletonYOffset * 50);
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
        
        // Apply z-depth scaling using alignment params
        const startZ = startPoint.z || 0;
        const endZ = endPoint.z || 0;
        const startDepthScale = 1 + startZ * alignmentParams.skeletonZDepth;
        const endDepthScale = 1 + endZ * alignmentParams.skeletonZDepth;

        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width * startDepthScale, startPoint.y * canvas.height * startDepthScale);
        ctx.lineTo(endPoint.x * canvas.width * endDepthScale, endPoint.y * canvas.height * endDepthScale);
        ctx.stroke();
      });

      // Draw all fingertip landmarks (smaller)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      
      // Draw all fingertips: Thumb(4), Index(8), Middle(12), Ring(16), Pinky(20)
      const fingertips = [4, 8, 12, 16, 20];
      fingertips.forEach(tipIndex => {
        const tip = hand[tipIndex];
        const tipZ = tip.z || 0;
        const depthScale = 1 + tipZ * alignmentParams.skeletonZDepth;
        ctx.beginPath();
        ctx.arc(
          tip.x * canvas.width * depthScale,
          tip.y * canvas.height * depthScale,
          3,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });

      // Draw wrist (smaller)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const wrist = hand[0];
      const wristZ = wrist.z || 0;
      const wristDepthScale = 1 + wristZ * alignmentParams.skeletonZDepth;
      ctx.beginPath();
      ctx.arc(
        wrist.x * canvas.width * wristDepthScale,
        wrist.y * canvas.height * wristDepthScale,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    
    ctx.restore();
  }, [landmarks, videoWidth, videoHeight, alignmentParams]);

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
