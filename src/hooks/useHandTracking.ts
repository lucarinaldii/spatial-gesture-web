import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandPosition {
  x: number;
  y: number;
  z: number;
  handIndex: number; // 0 or 1 for left/right hand
}

export interface GestureState {
  isPinching: boolean;
  isPointing: boolean;
  pinchStrength: number;
  handIndex: number;
}

export const useHandTracking = () => {
  const [isReady, setIsReady] = useState(false);
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const [gestureStates, setGestureStates] = useState<GestureState[]>([]);
  const [landmarks, setLandmarks] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastPositionsRef = useRef<HandPosition[]>([]);
  
  // Smoothing parameters
  const SMOOTHING_FACTOR = 0.3; // Lower = smoother but more lag
  const MOVEMENT_THRESHOLD = 0.005; // Minimum movement to register

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

  const detectGestures = useCallback((result: HandLandmarkerResult) => {
    if (result.landmarks && result.landmarks.length > 0) {
      const newPositions: HandPosition[] = [];
      const newGestures: GestureState[] = [];
      
      // Process each detected hand (up to 2)
      for (let i = 0; i < Math.min(result.landmarks.length, 2); i++) {
        const hand = result.landmarks[i];
        
        // Index finger tip (landmark 8)
        const indexTip = hand[8];
        
        // Thumb tip (landmark 4)
        const thumbTip = hand[4];
        
        // Calculate pinch distance
        const pinchDistance = calculateDistance(indexTip, thumbTip);
        const pinchThreshold = 0.05;
        
        const isPinching = pinchDistance < pinchThreshold;
        const pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDistance / pinchThreshold)));
        
        // Create raw position (mirrored for natural movement)
        const rawPosition: HandPosition = {
          x: 1 - indexTip.x,
          y: indexTip.y,
          z: indexTip.z || 0,
          handIndex: i,
        };
        
        // Apply smoothing
        const smoothedPosition = smoothPosition(rawPosition, lastPositionsRef.current[i]);
        
        newPositions.push(smoothedPosition);
        newGestures.push({
          isPinching,
          isPointing: true,
          pinchStrength,
          handIndex: i,
        });
      }
      
      lastPositionsRef.current = newPositions;
      setHandPositions(newPositions);
      setGestureStates(newGestures);
      setLandmarks(result.landmarks);
    } else {
      setHandPositions([]);
      setGestureStates([]);
      setLandmarks(null);
      lastPositionsRef.current = [];
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
    videoRef,
    startCamera,
  };
};
