import { useRef, useEffect } from 'react';
import { AlignmentParams } from '../types';
import { interpolateAlignmentParams } from '../utils/handBoneCalculations';

export interface HandSkeletonProps {
  landmarks: any;
  videoWidth: number;
  videoHeight: number;
  alignmentParams: AlignmentParams;
  handedness?: any;
  lineColor?: string;
  lineWidth?: number;
  className?: string;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export const HandSkeleton = ({
  landmarks,
  videoWidth,
  videoHeight,
  alignmentParams,
  handedness,
  lineColor,
  lineWidth = 1.5,
  className = '',
}: HandSkeletonProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determine skeleton color
    let skeletonColor = lineColor;
    if (!skeletonColor) {
      try {
        const rootStyles = getComputedStyle(document.documentElement);
        const foregroundHSL = rootStyles.getPropertyValue('--foreground').trim();
        if (foregroundHSL) {
          const [h, s, l] = foregroundHSL.split(' ').map(v => parseFloat(v.replace('%', '')));
          skeletonColor = `hsla(${h}, ${s}%, ${l}%, 0.9)`;
        }
      } catch {
        skeletonColor = 'rgba(255, 255, 255, 0.9)';
      }
    }
    if (!skeletonColor) {
      skeletonColor = 'rgba(255, 255, 255, 0.9)';
    }
    
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    landmarks.forEach((hand: any, handIndex: number) => {
      const handWrist = hand[0];
      const handMiddleMCP = hand[9];
      const handCenterX = (handWrist.x + handMiddleMCP.x) / 2;
      
      const handParams = interpolateAlignmentParams(
        alignmentParams.leftHand as unknown as { [key: string]: number },
        alignmentParams.rightHand as unknown as { [key: string]: number },
        handCenterX
      );
      
      ctx.save();
      
      const scaleFactor = handParams.skeletonScale;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const xOffset = (handParams.skeletonXOffset / 100) * window.innerWidth;
      const yOffset = (handParams.skeletonYOffset / 100) * window.innerHeight;
      ctx.translate(centerX + xOffset, centerY + yOffset);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(-centerX, -centerY);
      
      ctx.strokeStyle = skeletonColor!;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const baseWidth = canvas.width;
      const baseHeight = canvas.height;

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];
        
        const startZ = startPoint.z || 0;
        const endZ = endPoint.z || 0;
        const startDepthScale = 1 + startZ * handParams.skeletonZDepth;
        const endDepthScale = 1 + endZ * handParams.skeletonZDepth;

        ctx.beginPath();
        ctx.moveTo(startPoint.x * baseWidth * startDepthScale, startPoint.y * baseHeight * startDepthScale);
        ctx.lineTo(endPoint.x * baseWidth * endDepthScale, endPoint.y * baseHeight * endDepthScale);
        ctx.stroke();
      });

      ctx.restore();
    });
    
    ctx.restore();
  }, [landmarks, videoWidth, videoHeight, alignmentParams, handedness, lineColor, lineWidth]);

  return (
    <canvas
      ref={canvasRef}
      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
      height={typeof window !== 'undefined' ? window.innerHeight : 1080}
      className={`fixed inset-0 w-full h-full pointer-events-none z-10 ${className}`}
    />
  );
};
