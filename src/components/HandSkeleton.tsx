import { useRef, useEffect } from 'react';
import { AlignmentParams } from './AlignmentSettings';

// Helper function to interpolate between left and right alignment parameters
const interpolateAlignmentParams = (
  leftParams: AlignmentParams['leftHand'],
  rightParams: AlignmentParams['rightHand'],
  handCenterX: number
) => {
  // Create a smooth blend zone from 0.3 to 0.7
  const blendZoneStart = 0.3;
  const blendZoneEnd = 0.7;
  
  let blend: number;
  if (handCenterX < blendZoneStart) {
    blend = 0; // Full left
  } else if (handCenterX > blendZoneEnd) {
    blend = 1; // Full right
  } else {
    // Smooth interpolation in the blend zone
    blend = (handCenterX - blendZoneStart) / (blendZoneEnd - blendZoneStart);
  }
  
  return {
    skeletonScale: leftParams.skeletonScale * (1 - blend) + rightParams.skeletonScale * blend,
    skeletonXOffset: leftParams.skeletonXOffset * (1 - blend) + rightParams.skeletonXOffset * blend,
    skeletonYOffset: leftParams.skeletonYOffset * (1 - blend) + rightParams.skeletonYOffset * blend,
    skeletonZDepth: leftParams.skeletonZDepth * (1 - blend) + rightParams.skeletonZDepth * blend,
    hand3DScale: leftParams.hand3DScale * (1 - blend) + rightParams.hand3DScale * blend,
    hand3DXOffset: leftParams.hand3DXOffset * (1 - blend) + rightParams.hand3DXOffset * blend,
    hand3DYOffset: leftParams.hand3DYOffset * (1 - blend) + rightParams.hand3DYOffset * blend,
    hand3DZDepth: leftParams.hand3DZDepth * (1 - blend) + rightParams.hand3DZDepth * blend,
  };
};

interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
  alignmentParams: AlignmentParams;
  handedness?: any; // MediaPipe handedness data
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

const HandSkeleton = ({ landmarks, videoWidth, videoHeight, alignmentParams, handedness }: HandSkeletonProps) => {
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Flip context horizontally to match mirrored video  
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    landmarks.forEach((hand: any, handIndex: number) => {
      // Calculate hand center from wrist (0) and middle finger base (9)
      const handWrist = hand[0];
      const handMiddleMCP = hand[9];
      const handCenterX = (handWrist.x + handMiddleMCP.x) / 2;
      
      // Get interpolated alignment params for smooth transitions
      const handParams = interpolateAlignmentParams(
        alignmentParams.leftHand,
        alignmentParams.rightHand,
        handCenterX
      );
      
      // Apply hand-specific alignment
      ctx.save();
      
      const scaleFactor = handParams.skeletonScale;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Use percentage-based offsets relative to viewport dimensions
      const xOffset = (handParams.skeletonXOffset / 100) * window.innerWidth;
      const yOffset = (handParams.skeletonYOffset / 100) * window.innerHeight;
      ctx.translate(centerX + xOffset, centerY + yOffset);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(-centerX, -centerY);
      
      // Draw connections with white opaque (thinner lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];
        
        // Apply z-depth scaling using hand-specific params
        const startZ = startPoint.z || 0;
        const endZ = endPoint.z || 0;
        const startDepthScale = 1 + startZ * handParams.skeletonZDepth;
        const endDepthScale = 1 + endZ * handParams.skeletonZDepth;

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
        const depthScale = 1 + tipZ * handParams.skeletonZDepth;
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
      const wristDepthScale = 1 + wristZ * handParams.skeletonZDepth;
      ctx.beginPath();
      ctx.arc(
        wrist.x * canvas.width * wristDepthScale,
        wrist.y * canvas.height * wristDepthScale,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.restore(); // Restore for this hand
    });
    
    ctx.restore(); // Restore main context
  }, [landmarks, videoWidth, videoHeight, alignmentParams, handedness]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};

export default HandSkeleton;
