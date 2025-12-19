# React Hand Tracking

A React-first hand tracking and gesture toolkit built on MediaPipe Tasks. Provides hooks, cursors, 2D/3D visualizers, and remote-hand helpers so you can control any UI with your hands.

## What’s inside

- 🖐️ Real-time hand tracking via MediaPipe (WASM served from CDN)
- 👆 Gesture detection (pinch, point, finger states + pinch strength)
- 🧭 Components: cursor, skeleton overlay, 3D hand model, welcome overlay
- 📡 Remote gestures: consume landmarks streamed from a phone or other device
- ⚙️ Configurable smoothing and thresholds
- 🧾 Full TypeScript types and d.ts output

## Install (local or packaged)

This repo ships the library source under `src/lib/hand-tracking`.

### Option 1: Use the packaged tarball
```bash
# from repo root
npm run build:hand-tracking    # bundles to dist
npm run pack:hand-tracking     # produces react-hand-tracking-0.1.0.tgz
npm install ./react-hand-tracking-0.1.0.tgz
```

### Option 2: Link from source (for local dev)
```bash
npm install file:src/lib/hand-tracking
```

### Peer dependencies
Install these in your host app:
```bash
npm install react react-dom three @react-three/fiber @react-three/drei @mediapipe/tasks-vision
```

> Camera access requires a secure context. Use `https://` even on LAN (self-signed cert is fine). MediaPipe assets are fetched from the CDN by default.

## Quick start (local camera, auto-start)

```tsx
import { useHandTracking, HandCursor, HandSkeleton, DEFAULT_ALIGNMENT_PARAMS } from 'react-hand-tracking';

function App() {
  // autoStart is true by default; set autoStart: false if you want a button
  const {
    isReady,
    handPositions,
    gestureStates,
    landmarks,
    videoRef,
  } = useHandTracking(true, { autoStart: true });

  return (
    <div>
      {/* Hidden video element for camera feed */}
      <video ref={videoRef} style={{ display: 'none' }} />
      
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

## Mobile-camera mode (remote)

Use your phone to capture hands and send landmarks over WebSocket/Supabase/etc. Feed those into `useRemoteGestures` and drive the same UI:

```tsx
import { useRemoteGestures, HandCursor } from 'react-hand-tracking';

function RemoteExample({ remoteLandmarks, remoteHandedness }) {
  const { handPositions, gestureStates } = useRemoteGestures(remoteLandmarks, remoteHandedness);

  return handPositions.map((pos, i) => (
    <HandCursor key={i} position={pos} gestureState={gestureStates[i]} />
  ));
}
```

Mobile capture can reuse the same `useHandTracking` hook on the phone, then broadcast `landmarks` + `handedness` to the desktop.

## API reference

### Exports
- Hooks: `useHandTracking`, `useRemoteGestures`
- Components: `HandCursor`, `HandSkeleton`, `Hand3DModel`, `HandWelcomeOverlay`
- Types: `HandPosition`, `GestureState`, `FingerState`, `AlignmentParams`, `HandTrackingConfig`, `UseHandTrackingResult`, etc.
- Utils: `calculateRotationFromHands`, `getHandAngle`, `HAND_LANDMARKS`, `FINGER_CHAINS`, `calculateHandPose`, `smoothPose`, `interpolateAlignmentParams`, `landmarkToVector3`, `calculateBoneRotation`

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
  minPresenceConfidence: 0.3,
  minTrackingConfidence: 0.3,
  smoothingFactor: 0.5,
  movementThreshold: 0.008,
  autoStart: true,
});
```
- Returns: tracking state, landmarks, handedness, and a `videoRef` to attach to a hidden `<video>`.
- `startCamera()` requests `getUserMedia`, waits for dimensions, then starts the MediaPipe loop. It runs automatically when `autoStart` is true.
- If you run SSR, guard usage with `typeof window !== 'undefined'`.

#### `useRemoteGestures(remoteLandmarks, remoteHandedness)`

Transforms landmarks/handedness arrays (e.g., from a phone over WebSocket/Supabase) into the same hand position + gesture objects used locally.

```tsx
const { handPositions, gestureStates } = useRemoteGestures(
  remoteLandmarks,
  remoteHandedness
);
```

### Components

#### `<HandCursor />`

Displays a floating cursor that mirrors the detected hand. Scales/reflects based on pinch state and hand index.

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

Renders a 3D hand model using Three.js. Supply `alignmentParams` to position/scale hands relative to the viewport.

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

### Types (key ones)

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

### Utilities (selected)

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

Requires camera access and WebGL support for 3D features. On mobile, browsers will block the camera if the page is not served over HTTPS.

## License

MIT

## Build & Publish (standalone)

The library lives in `src/lib/hand-tracking` with its own `package.json`. To bundle it without the rest of the app:

```bash
# from repo root
npm run build:hand-tracking   # outputs ESM+CJS+d.ts to src/lib/hand-tracking/dist
npm run pack:hand-tracking    # creates react-hand-tracking-*.tgz you can npm install
```

Peer deps are declared (React, MediaPipe, Three/React-Three) so consumers keep a single copy.

## Hand-as-mouse quickstart

Drop this into any React app after installing the package to move a cursor and click on pinch:

```tsx
import { useEffect, useRef } from 'react';
import { useHandTracking, HandCursor } from 'react-hand-tracking';

export function HandMouse() {
  const { isReady, handPositions, gestureStates, videoRef, startCamera } = useHandTracking(true);
  const wasPinching = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    startCamera();
  }, [isReady, startCamera]);

  useEffect(() => {
    const pos = handPositions[0];
    const gesture = gestureStates[0];
    if (!pos || !gesture) return;

    const clientX = pos.x * window.innerWidth;
    const clientY = pos.y * window.innerHeight;
    const target = document.elementFromPoint(clientX, clientY);
    if (!target) return;

    target.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, bubbles: true }));

    const justPinched = gesture.isPinching && !wasPinching.current;
    const justReleased = !gesture.isPinching && wasPinching.current;
    if (justPinched) {
      target.dispatchEvent(new PointerEvent('pointerdown', { clientX, clientY, bubbles: true }));
      target.dispatchEvent(new PointerEvent('click', { clientX, clientY, bubbles: true }));
    }
    if (justReleased) {
      target.dispatchEvent(new PointerEvent('pointerup', { clientX, clientY, bubbles: true }));
    }
    wasPinching.current = gesture.isPinching;
  }, [handPositions, gestureStates]);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} />
      {handPositions.map((pos, i) => (
        <HandCursor key={i} position={pos} gestureState={gestureStates[i]} />
      ))}
    </>
  );
}
```

This uses pinch to trigger click events at the hand position; adjust the gesture logic to match your UX.
