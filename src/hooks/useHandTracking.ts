import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandPosition {
  x: number;
  y: number;
  z: number;
  handIndex: number; // 0 or 1 for left/right hand
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

export const useHandTracking = () => {
  const [isReady, setIsReady] = useState(false);
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const [gestureStates, setGestureStates] = useState<GestureState[]>([]);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [handedness, setHandedness] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastPositionsRef = useRef<HandPosition[]>([]);
  const lastPinchStatesRef = useRef<boolean[]>([false, false]); // Track previous pinch states
  const lastLandmarksRef = useRef<any>(null); // Store previous landmarks for smoothing
  
  // Smoothing parameters - adjusted for natural movements
  const SMOOTHING_FACTOR = 0.5; // Higher = more responsive, lower = smoother
  const LANDMARK_SMOOTHING = 0.7; // Smoothing for landmark positions (higher = smoother)
  const MOVEMENT_THRESHOLD = 0.008; // Increased deadzone for stability
  
  // Pinch detection with hysteresis to prevent jitter
  const PINCH_THRESHOLD_ENTER = 0.01; // Distance to enter pinch state (very close)
  const PINCH_THRESHOLD_EXIT = 0.09; // Distance to exit pinch state (larger = easier to maintain)

  const calculateDistance = (point1: any, point2: any) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const smoothPosition = (newPos: HandPosition, lastPos: HandPosition | undefined): HandPosition => {
    if (!lastPos) return newPos;
    
    const dx = newPos.x - lastPos.x;
    const dy = newPos.y - lastPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If movement is too small, don't update (deadzone)
    if (distance < MOVEMENT_THRESHOLD) {
      return lastPos;
    }
    
    // Apply smoothing
    return {
      x: lastPos.x + dx * SMOOTHING_FACTOR,
      y: lastPos.y + dy * SMOOTHING_FACTOR,
      z: lastPos.z + (newPos.z - lastPos.z) * SMOOTHING_FACTOR,
      handIndex: newPos.handIndex,
    };
  };

  const smoothLandmarks = (newLandmarks: any, previousLandmarks: any) => {
    if (!previousLandmarks || previousLandmarks.length !== newLandmarks.length) {
      return newLandmarks;
    }
    
    return newLandmarks.map((hand: any, handIndex: number) => {
      if (!previousLandmarks[handIndex]) return hand;
      
      return hand.map((landmark: any, landmarkIndex: number) => {
        const prev = previousLandmarks[handIndex][landmarkIndex];
        if (!prev) return landmark;
        
        return {
          x: prev.x + (landmark.x - prev.x) * LANDMARK_SMOOTHING,
          y: prev.y + (landmark.y - prev.y) * LANDMARK_SMOOTHING,
          z: prev.z + (landmark.z - prev.z) * LANDMARK_SMOOTHING,
        };
      });
    });
  };

  const detectGestures = useCallback((result: HandLandmarkerResult) => {
    if (result.landmarks && result.landmarks.length > 0) {
      // Apply smoothing to landmarks
      const smoothedLandmarks = smoothLandmarks(result.landmarks, lastLandmarksRef.current);
      lastLandmarksRef.current = smoothedLandmarks;
      
      const newPositions: HandPosition[] = [];
      const newGestures: GestureState[] = [];
      
      // Process each detected hand (up to 2)
      for (let i = 0; i < Math.min(smoothedLandmarks.length, 2); i++) {
        const hand = smoothedLandmarks[i];
        
        // Index finger tip (landmark 8)
        const indexTip = hand[8];
        
        // Thumb tip (landmark 4)
        const thumbTip = hand[4];
        
        // Calculate pinch distance
        const pinchDistance = calculateDistance(indexTip, thumbTip);
        
        // Hysteresis for stable pinch detection
        const wasPinching = lastPinchStatesRef.current[i] || false;
        const threshold = wasPinching ? PINCH_THRESHOLD_EXIT : PINCH_THRESHOLD_ENTER;
        const isPinching = pinchDistance < threshold;
        
        // Update pinch state history
        lastPinchStatesRef.current[i] = isPinching;
        
        const pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDistance / PINCH_THRESHOLD_ENTER)));
        
        // Create raw position (mirrored for natural movement)
        const rawPosition: HandPosition = {
          x: 1 - indexTip.x,
          y: indexTip.y,
          z: indexTip.z || 0,
          handIndex: i,
        };
        
        // Apply smoothing
        const smoothedPosition = smoothPosition(rawPosition, lastPositionsRef.current[i]);
        
        // Detect individual finger states
        const isFingerExtended = (tipIndex: number, baseIndex: number) => {
          const tip = hand[tipIndex];
          const base = hand[baseIndex];
          return tip.y < base.y - 0.05; // Finger is extended if tip is above base
        };

        newPositions.push(smoothedPosition);
        newGestures.push({
          isPinching,
          isPointing: !isPinching,
          pinchStrength,
          handIndex: i,
          fingers: {
            thumb: {
              isExtended: isFingerExtended(4, 2),
              tipPosition: { x: 1 - hand[4].x, y: hand[4].y, z: hand[4].z || 0 }
            },
            index: {
              isExtended: isFingerExtended(8, 5),
              tipPosition: { x: 1 - hand[8].x, y: hand[8].y, z: hand[8].z || 0 }
            },
            middle: {
              isExtended: isFingerExtended(12, 9),
              tipPosition: { x: 1 - hand[12].x, y: hand[12].y, z: hand[12].z || 0 }
            },
            ring: {
              isExtended: isFingerExtended(16, 13),
              tipPosition: { x: 1 - hand[16].x, y: hand[16].y, z: hand[16].z || 0 }
            },
            pinky: {
              isExtended: isFingerExtended(20, 17),
              tipPosition: { x: 1 - hand[20].x, y: hand[20].y, z: hand[20].z || 0 }
            }
          }
        });
      }
      
      lastPositionsRef.current = newPositions;
      setHandPositions(newPositions);
      setGestureStates(newGestures);
      setLandmarks(smoothedLandmarks);
      setHandedness(result.handedness);
    } else {
      lastLandmarksRef.current = null;
      setHandPositions([]);
      setGestureStates([]);
      setLandmarks(null);
      setHandedness(null);
      lastPositionsRef.current = [];
      lastPinchStatesRef.current = [false, false]; // Reset pinch states when no hands detected
    }
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !handLandmarkerRef.current) {
      return;
    }

    // Only process if video is ready
    if (videoRef.current.readyState >= 2) {
      try {
        const startTimeMs = performance.now();
        const results = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          startTimeMs
        );
        detectGestures(results);
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [detectGestures]);

  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      
      if (!videoRef.current) {
        console.error('❌ Video element not found!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
      });

      console.log('✓ Camera stream obtained');
      videoRef.current.srcObject = stream;
      
      // Play the video and wait for it to have dimensions
      await videoRef.current.play();
      console.log('✓ Video playing');
      
      // Wait for video to have valid dimensions
      await new Promise<void>((resolve) => {
        const checkDimensions = () => {
          if (videoRef.current && 
              videoRef.current.videoWidth > 0 && 
              videoRef.current.videoHeight > 0) {
            console.log('✓ Video ready with dimensions:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            resolve();
          } else {
            requestAnimationFrame(checkDimensions);
          }
        };
        checkDimensions();
      });
      
      // Start processing frames
      console.log('✓ Starting frame processing...');
      processFrame();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [processFrame]);

  useEffect(() => {
    let mounted = true;

    const initHandTracking = async () => {
      try {
        console.log('🔧 Initializing MediaPipe...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2, // Track up to 2 hands
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        if (mounted) {
          handLandmarkerRef.current = handLandmarker;
          setIsReady(true);
          console.log('✓ MediaPipe ready!');
        }
      } catch (error) {
        console.error('Error initializing hand tracking:', error);
      }
    };

    initHandTracking();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isReady,
    handPositions,
    gestureStates,
    landmarks,
    handedness,
    videoRef,
    startCamera,
  };
};
