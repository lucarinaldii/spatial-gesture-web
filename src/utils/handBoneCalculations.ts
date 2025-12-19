import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

// MediaPipe hand landmark indices
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};

// Finger chains for bone calculations
export const FINGER_CHAINS = {
  thumb: [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.THUMB_CMC, HAND_LANDMARKS.THUMB_MCP, HAND_LANDMARKS.THUMB_IP, HAND_LANDMARKS.THUMB_TIP],
  index: [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.INDEX_MCP, HAND_LANDMARKS.INDEX_PIP, HAND_LANDMARKS.INDEX_DIP, HAND_LANDMARKS.INDEX_TIP],
  middle: [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.MIDDLE_MCP, HAND_LANDMARKS.MIDDLE_PIP, HAND_LANDMARKS.MIDDLE_DIP, HAND_LANDMARKS.MIDDLE_TIP],
  ring: [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.RING_MCP, HAND_LANDMARKS.RING_PIP, HAND_LANDMARKS.RING_DIP, HAND_LANDMARKS.RING_TIP],
  pinky: [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.PINKY_MCP, HAND_LANDMARKS.PINKY_PIP, HAND_LANDMARKS.PINKY_DIP, HAND_LANDMARKS.PINKY_TIP],
};

/**
 * Convert MediaPipe normalized coordinates to 3D world space
 */
export function landmarkToVector3(landmark: NormalizedLandmark, scale = 1): THREE.Vector3 {
  // MediaPipe provides x, y (0-1 normalized), z (depth relative to wrist)
  // We need to flip x because the video is mirrored
  return new THREE.Vector3(
    (1 - landmark.x) * scale - scale / 2, // Center and flip horizontally
    -landmark.y * scale + scale / 2, // Center and flip vertically
    -landmark.z * scale * 2 // Scale depth and invert for correct orientation
  );
}

/**
 * Calculate rotation between two points
 */
export function calculateBoneRotation(
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  upVector = new THREE.Vector3(0, 1, 0)
): THREE.Quaternion {
  const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
  const quaternion = new THREE.Quaternion();
  
  // Create a matrix that looks from start to end
  const matrix = new THREE.Matrix4();
  matrix.lookAt(startPoint, endPoint, upVector);
  quaternion.setFromRotationMatrix(matrix);
  
  return quaternion;
}

/**
 * Calculate hand pose and finger rotations from landmarks
 */
export function calculateHandPose(landmarks: NormalizedLandmark[], scale = 1) {
  const vectors = landmarks.map(lm => landmarkToVector3(lm, scale));
  
  // Hand position (wrist)
  const handPosition = vectors[HAND_LANDMARKS.WRIST].clone();
  
  // Calculate hand orientation from palm landmarks
  const wrist = vectors[HAND_LANDMARKS.WRIST];
  const indexMcp = vectors[HAND_LANDMARKS.INDEX_MCP];
  const pinkyMcp = vectors[HAND_LANDMARKS.PINKY_MCP];
  
  // Palm normal (cross product of palm vectors)
  const palmVector1 = new THREE.Vector3().subVectors(indexMcp, wrist);
  const palmVector2 = new THREE.Vector3().subVectors(pinkyMcp, wrist);
  const palmNormal = new THREE.Vector3().crossVectors(palmVector1, palmVector2).normalize();
  
  // Hand orientation quaternion
  const handRotation = new THREE.Quaternion();
  const targetMatrix = new THREE.Matrix4();
  targetMatrix.lookAt(wrist, wrist.clone().add(palmNormal), new THREE.Vector3(0, 1, 0));
  handRotation.setFromRotationMatrix(targetMatrix);
  
  // Calculate finger rotations
  const fingerRotations: Record<string, THREE.Quaternion[]> = {};
  
  Object.entries(FINGER_CHAINS).forEach(([fingerName, chain]) => {
    fingerRotations[fingerName] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const start = vectors[chain[i]];
      const end = vectors[chain[i + 1]];
      const rotation = calculateBoneRotation(start, end);
      fingerRotations[fingerName].push(rotation);
    }
  });
  
  return {
    position: handPosition,
    rotation: handRotation,
    fingerRotations,
    vectors,
  };
}

/**
 * Smooth pose transitions to reduce jitter
 */
export function smoothPose(
  currentPose: { position: THREE.Vector3; rotation: THREE.Quaternion },
  targetPose: { position: THREE.Vector3; rotation: THREE.Quaternion },
  smoothingFactor = 0.3
): { position: THREE.Vector3; rotation: THREE.Quaternion } {
  const smoothedPosition = new THREE.Vector3().lerpVectors(
    currentPose.position,
    targetPose.position,
    smoothingFactor
  );
  
  const smoothedRotation = new THREE.Quaternion().slerpQuaternions(
    currentPose.rotation,
    targetPose.rotation,
    smoothingFactor
  );
  
  return {
    position: smoothedPosition,
    rotation: smoothedRotation,
  };
}
