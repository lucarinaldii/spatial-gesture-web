import { useState, useEffect } from 'react';
import { GestureState, HandPosition } from './useHandTracking';

const PINCH_THRESHOLD = 0.05;
const POINTING_THRESHOLD = 0.15;

interface Landmark {
  x: number;
  y: number;
  z: number;
}

const calculateDistance = (p1: Landmark, p2: Landmark): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const isFingerExtended = (landmarks: Landmark[], tipIndex: number, pipIndex: number, mcpIndex: number): boolean => {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];
  
  // Check if tip is further from wrist than pip
  return tip.y < pip.y && pip.y < mcp.y;
};

const detectGesture = (handLandmarks: Landmark[], handIndex: number): GestureState => {
  const thumbTip = handLandmarks[4];
  const indexTip = handLandmarks[8];
  const middleTip = handLandmarks[12];
  const ringTip = handLandmarks[16];
  const pinkyTip = handLandmarks[20];
  
  // Calculate pinch between thumb and index
  const pinchDistance = calculateDistance(thumbTip, indexTip);
  const isPinching = pinchDistance < PINCH_THRESHOLD;
  const pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDistance / PINCH_THRESHOLD)));
  
  // Detect finger extensions
  const thumbExtended = isFingerExtended(handLandmarks, 4, 3, 2);
  const indexExtended = isFingerExtended(handLandmarks, 8, 7, 6);
  const middleExtended = isFingerExtended(handLandmarks, 12, 11, 10);
  const ringExtended = isFingerExtended(handLandmarks, 16, 15, 14);
  const pinkyExtended = isFingerExtended(handLandmarks, 20, 19, 18);
  
  // Pointing gesture: only index finger extended
  const isPointing = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
  
  return {
    isPinching,
    isPointing,
    pinchStrength,
    handIndex,
    fingers: {
      thumb: {
        isExtended: thumbExtended,
        tipPosition: { x: thumbTip.x * 100, y: thumbTip.y * 100, z: thumbTip.z }
      },
      index: {
        isExtended: indexExtended,
        tipPosition: { x: indexTip.x * 100, y: indexTip.y * 100, z: indexTip.z }
      },
      middle: {
        isExtended: middleExtended,
        tipPosition: { x: middleTip.x * 100, y: middleTip.y * 100, z: middleTip.z }
      },
      ring: {
        isExtended: ringExtended,
        tipPosition: { x: ringTip.x * 100, y: ringTip.y * 100, z: ringTip.z }
      },
      pinky: {
        isExtended: pinkyExtended,
        tipPosition: { x: pinkyTip.x * 100, y: pinkyTip.y * 100, z: pinkyTip.z }
      }
    }
  };
};

const calculateHandPosition = (handLandmarks: Landmark[], handIndex: number): HandPosition => {
  // Use wrist as the hand center, keep coordinates normalized (0-1)
  const wrist = handLandmarks[0];
  
  return {
    x: wrist.x,
    y: wrist.y,
    z: wrist.z,
    handIndex
  };
};

export const useRemoteGestures = (remoteLandmarks: any, remoteHandedness: any) => {
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const [gestureStates, setGestureStates] = useState<GestureState[]>([]);

  useEffect(() => {
    if (!remoteLandmarks || remoteLandmarks.length === 0) {
      setHandPositions([]);
      setGestureStates([]);
      return;
    }

    const positions: HandPosition[] = [];
    const gestures: GestureState[] = [];

    remoteLandmarks.forEach((handLandmarks: Landmark[], index: number) => {
      console.log(`Remote hand ${index}: detecting gestures`);
      positions.push(calculateHandPosition(handLandmarks, index));
      gestures.push(detectGesture(handLandmarks, index));
    });

    console.log('Remote hand positions:', positions);
    console.log('Remote gesture states:', gestures);

    setHandPositions(positions);
    setGestureStates(gestures);
  }, [remoteLandmarks, remoteHandedness]);

  return {
    handPositions,
    gestureStates
  };
};
