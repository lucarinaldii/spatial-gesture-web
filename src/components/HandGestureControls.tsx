import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { GestureState, HandPosition } from '@/lib/hand-tracking';
import * as THREE from 'three';

interface HandGestureControlsProps {
  gestureStates: GestureState[];
  handPositions: HandPosition[];
}

export const HandGestureControls = ({ gestureStates, handPositions }: HandGestureControlsProps) => {
  const { camera } = useThree();
  const lastPinchPosition = useRef<{ x: number; y: number } | null>(null);

  useFrame(() => {
    // Only handle single hand pinch for panning
    if (gestureStates.length === 1 && handPositions.length === 1) {
      const gesture = gestureStates[0];
      const hand = handPositions[0];

      if (gesture.isPinching) {
        const currentPos = { x: hand.x, y: hand.y };

        if (lastPinchPosition.current) {
          // Calculate pan delta
          const deltaX = (currentPos.x - lastPinchPosition.current.x) * 10;
          const deltaY = (currentPos.y - lastPinchPosition.current.y) * 10;

          // Move camera based on hand movement
          camera.position.x -= deltaX;
          camera.position.y += deltaY;
        }

        lastPinchPosition.current = currentPos;
      } else {
        lastPinchPosition.current = null;
      }
    } else {
      // Reset if not single hand or if two hands (disable zoom)
      lastPinchPosition.current = null;
    }
  });

  return null;
};
