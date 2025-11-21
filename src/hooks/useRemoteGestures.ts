import { useState, useEffect, useRef } from 'react';
import { GestureState, HandPosition } from './useHandTracking';

const PINCH_THRESHOLD = 0.05;
const POINTING_THRESHOLD = 0.15;
const SMOOTHING_FACTOR = 0.4; // Higher = more responsive, lower = smoother

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

const smoothLandmark = (current: Landmark, previous: Landmark | null, factor: number): Landmark => {
  if (!previous) return current;
  
  return {
    x: previous.x + (current.x - previous.x) * factor,
    y: previous.y + (current.y - previous.y) * factor,
    z: previous.z + (current.z - previous.z) * factor,
  };
};

const calculateHandPosition = (
  handLandmarks: Landmark[], 
  handIndex: number,
  previousLandmarks: Landmark[] | null
): HandPosition => {
  // Use index fingertip as interaction point, mirrored horizontally like desktop
  const indexTip = handLandmarks[8];
  const previousIndexTip = previousLandmarks ? previousLandmarks[8] : null;
  
  // Apply exponential smoothing to reduce jitter
  const smoothedTip = smoothLandmark(indexTip, previousIndexTip, SMOOTHING_FACTOR);
  
  return {
    x: 1 - smoothedTip.x,
    y: smoothedTip.y,
    z: smoothedTip.z,
    handIndex
  };
};

export const useRemoteGestures = (remoteLandmarks: any, remoteHandedness: any) => {
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const [gestureStates, setGestureStates] = useState<GestureState[]>([]);
  const previousLandmarksRef = useRef<Landmark[][] | null>(null);
  const previousGesturesRef = useRef<GestureState[]>([]);

  useEffect(() => {
    if (!remoteLandmarks || remoteLandmarks.length === 0) {
      setHandPositions([]);
      setGestureStates([]);
      previousLandmarksRef.current = null;
      return;
    }

    const positions: HandPosition[] = [];
    const gestures: GestureState[] = [];

    remoteLandmarks.forEach((handLandmarks: Landmark[], index: number) => {
      // Apply smoothing to all landmarks
      const previousHandLandmarks = previousLandmarksRef.current?.[index] || null;
      const smoothedLandmarks = handLandmarks.map((landmark, i) => 
        smoothLandmark(landmark, previousHandLandmarks?.[i] || null, SMOOTHING_FACTOR)
      );

      positions.push(calculateHandPosition(smoothedLandmarks, index, previousHandLandmarks));
      
      const gesture = detectGesture(smoothedLandmarks, index);
      
      // Smooth pinch strength to prevent flickering
      const previousGesture = previousGesturesRef.current[index];
      if (previousGesture) {
        gesture.pinchStrength = previousGesture.pinchStrength + 
          (gesture.pinchStrength - previousGesture.pinchStrength) * SMOOTHING_FACTOR;
      }
      
      gestures.push(gesture);
    });

    previousLandmarksRef.current = remoteLandmarks;
    previousGesturesRef.current = gestures;

    setHandPositions(positions);
    setGestureStates(gestures);
  }, [remoteLandmarks, remoteHandedness]);

  return {
    handPositions,
    gestureStates
  };
};
