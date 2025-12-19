// React Hand Tracking Library
// A comprehensive hand tracking and gesture detection library for React applications

// Types
export type {
  HandPosition,
  FingerState,
  GestureState,
  AlignmentParams,
  HandAlignmentConfig,
  RotationAngles,
  HandTrackingConfig,
  UseHandTrackingResult,
} from './types';

export { DEFAULT_ALIGNMENT_PARAMS } from './types';

// Hooks
export { useHandTracking } from './hooks/useHandTracking';
export { useRemoteGestures } from './hooks/useRemoteGestures';

// Components
export { HandCursor } from './components/HandCursor';
export type { HandCursorProps } from './components/HandCursor';

export { HandSkeleton } from './components/HandSkeleton';
export type { HandSkeletonProps } from './components/HandSkeleton';

export { Hand3DModel } from './components/Hand3DModel';
export type { Hand3DModelProps } from './components/Hand3DModel';

export { HandWelcomeOverlay } from './components/HandWelcomeOverlay';
export type { HandWelcomeOverlayProps } from './components/HandWelcomeOverlay';

// Utilities
export {
  calculateRotationFromHands,
  getHandAngle,
} from './utils/rotationHelpers';

export {
  HAND_LANDMARKS,
  FINGER_CHAINS,
  landmarkToVector3,
  calculateBoneRotation,
  calculateHandPose,
  smoothPose,
  interpolateAlignmentParams,
} from './utils/handBoneCalculations';
