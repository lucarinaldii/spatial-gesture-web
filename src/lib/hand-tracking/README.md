# React Hand Tracking

A comprehensive hand tracking and gesture detection library for React applications using MediaPipe.

## Features

- 🖐️ Real-time hand tracking with MediaPipe
- 👆 Gesture detection (pinch, point, finger states)
- 🎨 Multiple visualization options (cursor, skeleton, 3D model)
- 📱 Remote gesture support for mobile-to-desktop connections
- ⚡ Optimized performance with configurable smoothing
- 🎯 TypeScript support with full type definitions

## Installation

```bash
npm install react-hand-tracking
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install react react-dom three @react-three/fiber @react-three/drei @mediapipe/tasks-vision
```

## Quick Start

```tsx
import { useHandTracking, HandCursor, HandSkeleton, DEFAULT_ALIGNMENT_PARAMS } from 'react-hand-tracking';

function App() {
  const {
    isReady,
    handPositions,
    gestureStates,
    landmarks,
    videoRef,
    startCamera,
  } = useHandTracking(true);

  return (
    <div>
      {/* Hidden video element for camera feed */}
      <video ref={videoRef} style={{ display: 'none' }} />
      
      {/* Start tracking button */}
      {isReady && (
        <button onClick={startCamera}>Start Tracking</button>
      )}
      
      {/* Hand cursors */}
      {handPositions.map((pos, i) => (
        <HandCursor 
          key={i} 
          position={pos} 
          gestureState={gestureStates[i]} 
        />
      ))}
      
      {/* Hand skeleton overlay */}
      {landmarks && (
        <HandSkeleton
          landmarks={landmarks}
          videoWidth={640}
          videoHeight={480}
          alignmentParams={DEFAULT_ALIGNMENT_PARAMS}
        />
      )}
    </div>
  );
}
```

## API Reference

### Hooks

#### `useHandTracking(enabled?, config?)`

Main hook for hand tracking functionality.

```tsx
const {
  isReady,        // boolean - MediaPipe is initialized
  handPositions,  // HandPosition[] - Detected hand positions
  gestureStates,  // GestureState[] - Gesture states for each hand
  landmarks,      // Raw MediaPipe landmarks
  handedness,     // Hand side information
  videoRef,       // Ref for video element
  startCamera,    // Function to start camera
} = useHandTracking(true, {
  maxHands: 2,
  minDetectionConfidence: 0.3,
  smoothingFactor: 0.5,
});
```

#### `useRemoteGestures(remoteLandmarks, remoteHandedness)`

Process landmark data received from a remote source (e.g., mobile device).

```tsx
const { handPositions, gestureStates } = useRemoteGestures(
  remoteLandmarks,
  remoteHandedness
);
```

### Components

#### `<HandCursor />`

Displays a hand cursor at the detected position.

```tsx
<HandCursor
  position={handPosition}
  gestureState={gestureState}
  className="custom-class"
/>
```

#### `<HandSkeleton />`

Renders a 2D skeleton overlay.

```tsx
<HandSkeleton
  landmarks={landmarks}
  videoWidth={640}
  videoHeight={480}
  alignmentParams={alignmentParams}
  lineColor="#ffffff"
  lineWidth={1.5}
/>
```

#### `<Hand3DModel />`

Renders a 3D hand model using Three.js.

```tsx
<Hand3DModel
  landmarks={landmarks}
  videoWidth={640}
  videoHeight={480}
  alignmentParams={alignmentParams}
  color="#ffffff"
  emissiveColor="#f8f8f8"
/>
```

#### `<HandWelcomeOverlay />`

Shows a welcome screen prompting users to show their hands.

```tsx
<HandWelcomeOverlay
  onDismiss={() => setShowOverlay(false)}
  autoDismissOnHand={true}
  hasHandDetected={handPositions.length > 0}
  title="Show your hand"
  subtitle="Position your hand in front of the camera"
  autoDismissTimeout={8000}
/>
```

### Types

```tsx
interface HandPosition {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  z: number;      // Depth
  handIndex: number;
}

interface GestureState {
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

interface FingerState {
  isExtended: boolean;
  tipPosition: { x: number; y: number; z: number };
}
```

### Utilities

```tsx
import {
  calculateRotationFromHands,
  getHandAngle,
  HAND_LANDMARKS,
  calculateHandPose,
  smoothPose,
} from 'react-hand-tracking';
```

## Configuration

### Alignment Parameters

Fine-tune hand visualization alignment:

```tsx
const alignmentParams = {
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
    // Same structure as leftHand
  },
};
```

## Browser Support

- Chrome 90+
- Edge 90+
- Safari 15.4+
- Firefox 90+

Requires camera access and WebGL support for 3D features.

## License

MIT
