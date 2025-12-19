import { RotationAngles } from '../types';

export const calculateRotationFromHands = (
  hand1X: number,
  hand1Y: number,
  hand2X: number,
  hand2Y: number,
  baseAngle: number
): RotationAngles => {
  // Calculate angle between hands for Z-axis rotation (spinning)
  const angle = Math.atan2(hand2Y - hand1Y, hand2X - hand1X) * (180 / Math.PI);
  const angleDiff = angle - baseAngle;
  
  // X-axis rotation: based on vertical offset between hands (tilting forward/backward)
  const verticalOffset = hand2Y - hand1Y;
  const rotateX = Math.max(-60, Math.min(60, verticalOffset * 3));
  
  // Y-axis rotation: based on horizontal offset between hands (tilting left/right)
  const horizontalOffset = hand2X - hand1X;
  const rotateY = Math.max(-60, Math.min(60, horizontalOffset * -3));
  
  return {
    x: rotateX,
    y: rotateY,
    z: angleDiff
  };
};

export const getHandAngle = (
  hand1X: number,
  hand1Y: number,
  hand2X: number,
  hand2Y: number
): number => {
  return Math.atan2(hand2Y - hand1Y, hand2X - hand1X) * (180 / Math.PI);
};
