import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandPosition {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  isPinching: boolean;
  isPointing: boolean;
  pinchStrength: number;
}

export const useHandTracking = () => {
  const [isReady, setIsReady] = useState(false);
  const [handPosition, setHandPosition] = useState<HandPosition | null>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    isPinching: false,
    isPointing: true,
    pinchStrength: 0,
  });
  const [landmarks, setLandmarks] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();

  const calculateDistance = (point1: any, point2: any) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const detectGestures = useCallback((result: HandLandmarkerResult) => {
    if (result.landmarks && result.landmarks.length > 0) {
      const hand = result.landmarks[0];
      
      console.log('✓ Hand detected! Landmarks:', hand.length);
      
      // Index finger tip (landmark 8)
      const indexTip = hand[8];
      
      // Thumb tip (landmark 4)
      const thumbTip = hand[4];
      
      // Calculate pinch distance
      const pinchDistance = calculateDistance(indexTip, thumbTip);
      const pinchThreshold = 0.05; // Adjust this value for sensitivity
      
      const isPinching = pinchDistance < pinchThreshold;
      const pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDistance / pinchThreshold)));
      
      // Update hand position (index finger tip)
      setHandPosition({
        x: indexTip.x,
        y: indexTip.y,
        z: indexTip.z || 0,
      });

      setGestureState({
        isPinching,
        isPointing: true,
        pinchStrength,
      });

      setLandmarks(result.landmarks);
    } else {
      console.log('✗ No hand detected');
      setHandPosition(null);
      setLandmarks(null);
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;

    // Check if video is ready and has valid dimensions
    if (videoRef.current.readyState < 2 || 
        videoRef.current.videoWidth === 0 || 
        videoRef.current.videoHeight === 0) {
      console.log('Video not ready yet, skipping frame');
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const startTimeMs = performance.now();
      const results = await handLandmarkerRef.current.detectForVideo(
        videoRef.current,
        startTimeMs
      );

      detectGestures(results);
    } catch (error) {
      console.error('Error processing frame:', error);
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      videoRef.current.srcObject = stream;
      
      // Wait for video metadata and play
      await videoRef.current.play();
      
      // Wait for video to have valid dimensions
      await new Promise<void>((resolve) => {
        const checkVideo = () => {
          if (videoRef.current && 
              videoRef.current.videoWidth > 0 && 
              videoRef.current.videoHeight > 0) {
            console.log('✓ Video ready:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            resolve();
          } else {
            requestAnimationFrame(checkVideo);
          }
        };
        checkVideo();
      });
      
      processFrame();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [processFrame]);

  useEffect(() => {
    let mounted = true;

    const initHandTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (mounted) {
          handLandmarkerRef.current = handLandmarker;
          setIsReady(true);
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
    handPosition,
    gestureState,
    landmarks,
    videoRef,
    startCamera,
  };
};
