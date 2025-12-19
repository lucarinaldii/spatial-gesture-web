import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandPosition, GestureState, HandTrackingConfig, UseHandTrackingResult } from '../types';

const DEFAULT_CONFIG: Required<HandTrackingConfig> = {
  maxHands: 2,
  minDetectionConfidence: 0.3,
  minPresenceConfidence: 0.3,
  minTrackingConfidence: 0.3,
  smoothingFactor: 0.5,
  movementThreshold: 0.008,
  autoStart: true,
};

export const useHandTracking = (
  enabled: boolean = true,
  config: HandTrackingConfig = {}
): UseHandTrackingResult => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [isReady, setIsReady] = useState(false);
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const [gestureStates, setGestureStates] = useState<GestureState[]>([]);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [handedness, setHandedness] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastPositionsRef = useRef<HandPosition[]>([]);
  const lastPinchStatesRef = useRef<boolean[]>([false, false]);
  const lastLandmarksRef = useRef<any>(null);
  const hasAutoStartedRef = useRef(false);
  
  const LANDMARK_SMOOTHING = 0.7;
  const PINCH_THRESHOLD_ENTER_BASE = 0.05;
  const PINCH_THRESHOLD_EXIT_BASE = 0.07;

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
    
    if (distance < mergedConfig.movementThreshold) {
      return lastPos;
    }
    
    return {
      x: lastPos.x + dx * mergedConfig.smoothingFactor,
      y: lastPos.y + dy * mergedConfig.smoothingFactor,
      z: lastPos.z + (newPos.z - lastPos.z) * mergedConfig.smoothingFactor,
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
      const smoothedLandmarks = smoothLandmarks(result.landmarks, lastLandmarksRef.current);
      lastLandmarksRef.current = smoothedLandmarks;
      
      const newPositions: HandPosition[] = [];
      const newGestures: GestureState[] = [];
      
      for (let i = 0; i < Math.min(smoothedLandmarks.length, mergedConfig.maxHands); i++) {
        const hand = smoothedLandmarks[i];
        const indexTip = hand[8];
        const thumbTip = hand[4];
        
        const pinchDistance = calculateDistance(indexTip, thumbTip);
        
        const avgZ = (indexTip.z + thumbTip.z) / 2;
        const depthScale = Math.max(1, 1 + Math.abs(avgZ) * 3);
        
        const wasPinching = lastPinchStatesRef.current[i] || false;
        const threshold = wasPinching 
          ? PINCH_THRESHOLD_EXIT_BASE * depthScale 
          : PINCH_THRESHOLD_ENTER_BASE * depthScale;
        const isPinching = pinchDistance < threshold;
        
        lastPinchStatesRef.current[i] = isPinching;
        
        const pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDistance / (PINCH_THRESHOLD_ENTER_BASE * depthScale))));
        
        const rawPosition: HandPosition = {
          x: 1 - indexTip.x,
          y: indexTip.y,
          z: indexTip.z || 0,
          handIndex: i,
        };
        
        const smoothedPosition = smoothPosition(rawPosition, lastPositionsRef.current[i]);
        
        const isFingerExtended = (tipIndex: number, baseIndex: number) => {
          const tip = hand[tipIndex];
          const base = hand[baseIndex];
          return tip.y < base.y - 0.05;
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
      lastPinchStatesRef.current = [false, false];
    }
  }, [mergedConfig.maxHands]);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !handLandmarkerRef.current) {
      return;
    }

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
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      await new Promise<void>((resolve) => {
        const checkDimensions = () => {
          if (videoRef.current && 
              videoRef.current.videoWidth > 0 && 
              videoRef.current.videoHeight > 0) {
            resolve();
          } else {
            requestAnimationFrame(checkDimensions);
          }
        };
        checkDimensions();
      });
      
      processFrame();
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }, [processFrame]);

  // Optional auto-start for local camera mode
  useEffect(() => {
    if (!enabled || !mergedConfig.autoStart) return;
    if (!isReady || !videoRef.current) return;
    if (hasAutoStartedRef.current) return;

    hasAutoStartedRef.current = true;
    startCamera().catch((error) => {
      console.error('Error auto-starting camera:', error);
    });
  }, [enabled, mergedConfig.autoStart, isReady, startCamera]);

  useEffect(() => {
    if (!enabled) return;
    
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
          numHands: mergedConfig.maxHands,
          minHandDetectionConfidence: mergedConfig.minDetectionConfidence,
          minHandPresenceConfidence: mergedConfig.minPresenceConfidence,
          minTrackingConfidence: mergedConfig.minTrackingConfidence,
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
  }, [enabled, mergedConfig.maxHands, mergedConfig.minDetectionConfidence, mergedConfig.minPresenceConfidence, mergedConfig.minTrackingConfidence]);

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
