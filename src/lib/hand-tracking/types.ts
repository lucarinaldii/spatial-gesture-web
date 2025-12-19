// Core types for hand tracking library

export interface HandPosition {
  x: number;
  y: number;
  z: number;
  handIndex: number;
}

export interface FingerState {
  isExtended: boolean;
  tipPosition: { x: number; y: number; z: number };
}

export interface GestureState {
  isPinching: boolean;
  isPointing: boolean;
  pinchStrength: number;
  handIndex: number;
  fingers: {
    thumb: FingerState;
    index: FingerState;
    middle: FingerState;
    ring: FingerState;
    pinky: FingerState;
  };
}

export interface AlignmentParams {
  leftHand: HandAlignmentConfig;
  rightHand: HandAlignmentConfig;
}

export interface HandAlignmentConfig {
  skeletonScale: number;
  skeletonXOffset: number;
  skeletonYOffset: number;
  skeletonZDepth: number;
  hand3DScale: number;
  hand3DXOffset: number;
  hand3DYOffset: number;
  hand3DZDepth: number;
}

export interface RotationAngles {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingConfig {
  maxHands?: number;
  minDetectionConfidence?: number;
  minPresenceConfidence?: number;
  minTrackingConfidence?: number;
  smoothingFactor?: number;
  movementThreshold?: number;
}

export interface UseHandTrackingResult {
  isReady: boolean;
  handPositions: HandPosition[];
  gestureStates: GestureState[];
  landmarks: any;
  handedness: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<void>;
}

export const DEFAULT_ALIGNMENT_PARAMS: AlignmentParams = {
  leftHand: {
    skeletonScale: 0.65,
    skeletonXOffset: 0,
    skeletonYOffset: 0,
    skeletonZDepth: 0.5,
    hand3DScale: 1.0,
    hand3DXOffset: 0,
    hand3DYOffset: 0,
    hand3DZDepth: 5,
  },
  rightHand: {
    skeletonScale: 0.65,
    skeletonXOffset: 0,
    skeletonYOffset: 0,
    skeletonZDepth: 0.5,
    hand3DScale: 1.0,
    hand3DXOffset: 0,
    hand3DYOffset: 0,
    hand3DZDepth: 5,
  },
};
