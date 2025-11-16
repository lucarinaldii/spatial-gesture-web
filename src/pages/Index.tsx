import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandSkeleton from '@/components/HandSkeleton';
import Hand3DModel from '@/components/Hand3DModel';
import InteractiveObject from '@/components/InteractiveObject';
import AlignmentSettings, { AlignmentParams } from '@/components/AlignmentSettings';
import WireConnection from '@/components/WireConnection';
import { useToast } from '@/hooks/use-toast';
import { Plus, RotateCcw, Eye, EyeOff, Settings, Trash2, Image, Link } from 'lucide-react';

interface ObjectData {
  id: string;
  type: 'card' | 'image' | 'pdf' | 'model3d';
  title?: string;
  description?: string;
  fileUrl?: string;
  position: { x: number; y: number };
  zIndex: number;
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  isPhysicsEnabled: boolean;
}

// Helper function to create placeholder hand landmarks in open pose
const createPlaceholderHandLandmarks = (hand: 'Left' | 'Right') => {
  const centerX = 0.5;
  const centerY = 0.5;
  const offset = hand === 'Left' ? -0.15 : 0.15;
  
  // Create open hand pose with normalized coordinates
  return [
    { x: centerX + offset, y: centerY, z: 0, visibility: 1 }, // Wrist (0)
    { x: centerX + offset - 0.02, y: centerY - 0.05, z: -0.01, visibility: 1 }, // Thumb CMC (1)
    { x: centerX + offset - 0.04, y: centerY - 0.08, z: -0.02, visibility: 1 }, // Thumb MCP (2)
    { x: centerX + offset - 0.05, y: centerY - 0.11, z: -0.03, visibility: 1 }, // Thumb IP (3)
    { x: centerX + offset - 0.06, y: centerY - 0.14, z: -0.04, visibility: 1 }, // Thumb tip (4)
    { x: centerX + offset + 0.01, y: centerY - 0.05, z: 0, visibility: 1 }, // Index MCP (5)
    { x: centerX + offset + 0.01, y: centerY - 0.10, z: 0, visibility: 1 }, // Index PIP (6)
    { x: centerX + offset + 0.01, y: centerY - 0.14, z: 0, visibility: 1 }, // Index DIP (7)
    { x: centerX + offset + 0.01, y: centerY - 0.18, z: 0, visibility: 1 }, // Index tip (8)
    { x: centerX + offset + 0.04, y: centerY - 0.04, z: 0, visibility: 1 }, // Middle MCP (9)
    { x: centerX + offset + 0.04, y: centerY - 0.10, z: 0, visibility: 1 }, // Middle PIP (10)
    { x: centerX + offset + 0.04, y: centerY - 0.15, z: 0, visibility: 1 }, // Middle DIP (11)
    { x: centerX + offset + 0.04, y: centerY - 0.19, z: 0, visibility: 1 }, // Middle tip (12)
    { x: centerX + offset + 0.06, y: centerY - 0.03, z: 0, visibility: 1 }, // Ring MCP (13)
    { x: centerX + offset + 0.06, y: centerY - 0.09, z: 0, visibility: 1 }, // Ring PIP (14)
    { x: centerX + offset + 0.06, y: centerY - 0.14, z: 0, visibility: 1 }, // Ring DIP (15)
    { x: centerX + offset + 0.06, y: centerY - 0.17, z: 0, visibility: 1 }, // Ring tip (16)
    { x: centerX + offset + 0.08, y: centerY - 0.01, z: 0, visibility: 1 }, // Pinky MCP (17)
    { x: centerX + offset + 0.08, y: centerY - 0.07, z: 0, visibility: 1 }, // Pinky PIP (18)
    { x: centerX + offset + 0.08, y: centerY - 0.11, z: 0, visibility: 1 }, // Pinky DIP (19)
    { x: centerX + offset + 0.08, y: centerY - 0.14, z: 0, visibility: 1 }, // Pinky tip (20)
  ];
};

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(true);
  const { isReady, handPositions, gestureStates, landmarks, handedness, videoRef, startCamera } = useHandTracking();
  const { toast } = useToast();
  
  const [objects, setObjects] = useState<ObjectData[]>([
    {
      id: '1',
      type: 'card',
      title: 'Spatial Card 1',
      description: 'Hover with your hand and pinch to drag',
      position: { x: 20, y: 35 },
      zIndex: 1,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    },
    {
      id: '2',
      type: 'card',
      title: 'Spatial Card 2',
      description: 'Experience natural gesture controls',
      position: { x: 50, y: 50 },
      zIndex: 2,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    },
    {
      id: '3',
      type: 'card',
      title: 'Spatial Card 3',
      description: 'Point and pinch for seamless interaction',
      position: { x: 80, y: 35 },
      zIndex: 3,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const [grabbedObjects, setGrabbedObjects] = useState<Map<number, { id: string; offsetX: number; offsetY: number; }>>(new Map());
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isImportButtonHovered, setIsImportButtonHovered] = useState(false);
  const [isRestartButtonHovered, setIsRestartButtonHovered] = useState(false);
  const lastPinchStates = useRef<Map<number, boolean>>(new Map());
  const lastImportButtonPinchState = useRef(false);
  const lastRestartButtonPinchState = useRef(false);
  const animationFrameRef = useRef<number>();
  const maxZIndexRef = useRef(3);
  const baseDistanceRef = useRef<Map<string, number>>(new Map());
  const baseAngleRef = useRef<Map<string, number>>(new Map());
  const canvasDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasZoomBaseDistanceRef = useRef<number | null>(null);
  const handVelocityHistoryRef = useRef<Map<number, Array<{ x: number; y: number; timestamp: number }>>>(new Map());
  const touchedObjects = useRef<Map<number, { id: string; offsetX: number; offsetY: number; }>>(new Map());
  const previousZPositionRef = useRef<Map<number, number>>(new Map());
  const [mergingCards, setMergingCards] = useState<Set<string>>(new Set());
  const [splittingCards, setSplittingCards] = useState<Set<string>>(new Set());
  const splitDistanceRef = useRef<Map<string, number>>(new Map());
  const [show3DHand, setShow3DHand] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Wire connection state
  const [activeWire, setActiveWire] = useState<{ startCardId: string; startConnector: string; handIndex: number } | null>(null);
  const [connections, setConnections] = useState<Array<{ id: string; fromCardId: string; fromConnector: string; toCardId: string; toConnector: string }>>([]);
  const [hoveredConnector, setHoveredConnector] = useState<string | null>(null);
  const hoveredConnectorRef = useRef<string | null>(null);
  // Delete zone disabled
  // const [showDeleteZone, setShowDeleteZone] = useState(false);
  // const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  
  const defaultAlignmentParams: AlignmentParams = {
    leftHand: {
      skeletonScale: 0.85,
      skeletonXOffset: -1.0,
      skeletonYOffset: 0.0,
      skeletonZDepth: 0.85,
      hand3DScale: 1.25,
      hand3DXOffset: 2.1,
      hand3DYOffset: 1.1,
      hand3DZDepth: 1.0,
    },
    rightHand: {
      skeletonScale: 0.74,
      skeletonXOffset: 2.2,
      skeletonYOffset: 1.8,
      skeletonZDepth: 0.65,
      hand3DScale: 1.21,
      hand3DXOffset: -2.2,
      hand3DYOffset: 0.7,
      hand3DZDepth: 1.0,
    },
  };
  
  const [alignmentParams, setAlignmentParams] = useState<AlignmentParams>(defaultAlignmentParams);

  const handleStartTracking = async () => {
    setIsTracking(true);
    setHasStartedTracking(true);
    setTimeout(async () => { await startCamera(); }, 200);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let type: 'image' | 'pdf' | 'model3d' = 'image';
    if (fileExtension === 'pdf') type = 'pdf';
    else if (['gltf', 'glb', 'obj', 'fbx'].includes(fileExtension || '')) type = 'model3d';
    
    maxZIndexRef.current += 1;
    setObjects(prev => [...prev, {
      id: Date.now().toString(),
      type,
      title: file.name,
      fileUrl,
      position: { x: 50, y: 50 },
      zIndex: maxZIndexRef.current,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    }]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file" });
      return;
    }
    
    const fileUrl = URL.createObjectURL(file);
    setCanvasBackground(fileUrl);
    
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    toast({ title: "Background updated!", description: "Canvas background has been set" });
  };

  const handleRestart = useCallback(() => {
    // Clear all refs and state
    setGrabbedObjects(new Map());
    touchedObjects.current.clear();
    baseDistanceRef.current.clear();
    baseAngleRef.current.clear();
    handVelocityHistoryRef.current.clear();
    previousZPositionRef.current.clear();
    lastPinchStates.current.clear();
    canvasDragStartRef.current = null;
    canvasZoomBaseDistanceRef.current = null;
    
    // Reset to initial cards
    setObjects([
      {
        id: '1',
        type: 'card',
        title: 'Spatial Card 1',
        description: 'Hover with your hand and pinch to drag',
        position: { x: 20, y: 35 },
        zIndex: 1,
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0 },
        isPhysicsEnabled: false,
      },
      {
        id: '2',
        type: 'card',
        title: 'Spatial Card 2',
        description: 'Experience natural gesture controls',
        position: { x: 50, y: 50 },
        zIndex: 2,
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0 },
        isPhysicsEnabled: false,
      },
      {
        id: '3',
        type: 'card',
        title: 'Spatial Card 3',
        description: 'Point and pinch for seamless interaction',
        position: { x: 80, y: 35 },
        zIndex: 3,
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0 },
        isPhysicsEnabled: false,
      },
    ]);
    
    // Reset canvas
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasZoom(1);
    setGrabbedObjects(new Map());
    setConnections([]);
    setActiveWire(null);
    setHoveredConnector(null);
    hoveredConnectorRef.current = null;
    maxZIndexRef.current = 3;
    baseDistanceRef.current.clear();
    baseAngleRef.current.clear();
    
    // Reset alignment parameters
    setAlignmentParams(defaultAlignmentParams);
  }, []);

  // Hand gesture detection for import button
  useEffect(() => {
    if (!importButtonRef.current || handPositions.length === 0 || !isTracking) {
      setIsImportButtonHovered(false);
      return;
    }

    const buttonRect = importButtonRef.current.getBoundingClientRect();
    let isHovering = false;
    let anyPinching = false;
    
    handPositions.forEach((handPos, handIndex) => {
      const handX = handPos.x * window.innerWidth;
      const handY = handPos.y * window.innerHeight;
      const isInBounds = handX >= buttonRect.left && handX <= buttonRect.right &&
                        handY >= buttonRect.top && handY <= buttonRect.bottom;
      
      if (isInBounds) {
        isHovering = true;
        const gesture = gestureStates[handIndex];
        const isPinching = gesture?.isPinching || false;
        
        // Trigger on pinch transition (from not pinching to pinching)
        if (isPinching && !lastImportButtonPinchState.current) {
          console.log('Import button pinched!');
          fileInputRef.current?.click();
        }
        
        if (isPinching) anyPinching = true;
      }
    });
    
    setIsImportButtonHovered(isHovering);
    lastImportButtonPinchState.current = anyPinching;
  }, [handPositions, gestureStates, isTracking]);

  // Hand gesture detection for restart button
  useEffect(() => {
    if (!restartButtonRef.current || handPositions.length === 0 || !isTracking) {
      setIsRestartButtonHovered(false);
      return;
    }

    const buttonRect = restartButtonRef.current.getBoundingClientRect();
    let isHovering = false;
    let anyPinching = false;
    
    handPositions.forEach((handPos, handIndex) => {
      const handX = handPos.x * window.innerWidth;
      const handY = handPos.y * window.innerHeight;
      const isInBounds = handX >= buttonRect.left && handX <= buttonRect.right &&
                        handY >= buttonRect.top && handY <= buttonRect.bottom;
      
      if (isInBounds) {
        isHovering = true;
        const gesture = gestureStates[handIndex];
        const isPinching = gesture?.isPinching || false;
        
        // Trigger on pinch transition (from not pinching to pinching)
        if (isPinching && !lastRestartButtonPinchState.current) {
          console.log('Restart button pinched!');
          handleRestart();
        }
        
        if (isPinching) anyPinching = true;
      }
    });
    
    setIsRestartButtonHovered(isHovering);
    lastRestartButtonPinchState.current = anyPinching;
  }, [handPositions, gestureStates, isTracking, handleRestart]);

  useEffect(() => {
    if (handPositions.length === 0) {
      if (grabbedObjects.size > 0) setGrabbedObjects(new Map());
      if (touchedObjects.current.size > 0) {
        // Release touched objects with inertia
        touchedObjects.current.forEach((touched, handIndex) => {
          const history = handVelocityHistoryRef.current.get(handIndex) || [];
          let velocityX = 0, velocityY = 0;
          if (history.length >= 2) {
            const recent = history[history.length - 1];
            const previous = history[0];
            const timeDelta = (recent.timestamp - previous.timestamp) / 1000;
            if (timeDelta > 0) {
              velocityX = (recent.x - previous.x) / timeDelta * 0.016;
              velocityY = (recent.y - previous.y) / timeDelta * 0.016;
            }
          }
          setObjects(prev => prev.map(obj => obj.id === touched.id ? { 
            ...obj, 
            isPhysicsEnabled: true, 
            velocity: { x: velocityX, y: velocityY } 
          } : obj));
        });
        touchedObjects.current.clear();
      }
      lastPinchStates.current.clear();
      handVelocityHistoryRef.current.clear();
      return;
    }

    const updateDrag = () => {
      const newGrabbedObjects = new Map(grabbedObjects);
      const newTouchedObjects = new Map(touchedObjects.current);
      let hasChanges = false;
      let hasTouchChanges = false;
      const objectUpdates = new Map<string, { position?: { x: number; y: number }, zIndex?: number, rotation?: { x: number; y: number; z: number } }>();
      let scaleUpdate: { id: string; scale: number } | null = null;

      handPositions.forEach((handPos, handIndex) => {
        const gesture = gestureStates[handIndex];
        if (!gesture) return;
        const isPinching = gesture.isPinching;
        const handX = handPos.x * 100;
        const handY = handPos.y * 100;
        const wasPinching = lastPinchStates.current.get(handIndex) || false;
        
        // Update hovered connector for visual feedback
        if (!isPinching) {
          const hoveredConn = checkConnectorHover(handX, handY);
          if (hoveredConn !== hoveredConnectorRef.current) {
            hoveredConnectorRef.current = hoveredConn;
            setHoveredConnector(hoveredConn);
          }
        }

        if (isPinching && !wasPinching) {
          // Check if hovering over a connector first
          const hoveredConn = checkConnectorHover(handX, handY);
          
          if (hoveredConn && showConnectors) {
            // Start wire connection instead of grabbing card
            const [cardId, position] = hoveredConn.split('-');
            setActiveWire({ startCardId: cardId, startConnector: position, handIndex });
          } else {
            // Release any touched objects when pinching starts
            if (newTouchedObjects.has(handIndex)) {
              const touched = newTouchedObjects.get(handIndex);
              if (touched) {
                newTouchedObjects.delete(handIndex);
                hasTouchChanges = true;
                setObjects(prev => prev.map(obj => obj.id === touched.id ? { 
                  ...obj, 
                  isPhysicsEnabled: true, 
                  velocity: { x: 0, y: 0 } 
                } : obj));
              }
            }
            
            const targetObject = objects.find((obj) => {
              const adjustedX = obj.position.x + canvasOffset.x;
              const adjustedY = obj.position.y + canvasOffset.y;
              return Math.abs(handX - adjustedX) < 16 && Math.abs(handY - adjustedY) < 12;
            });

            if (targetObject) {
              const adjustedX = targetObject.position.x + canvasOffset.x;
              const adjustedY = targetObject.position.y + canvasOffset.y;
              newGrabbedObjects.set(handIndex, { id: targetObject.id, offsetX: handX - adjustedX, offsetY: handY - adjustedY });
              hasChanges = true;
              maxZIndexRef.current += 1;
              objectUpdates.set(targetObject.id, { ...(objectUpdates.get(targetObject.id) || {}), zIndex: maxZIndexRef.current });
              setObjects(prev => prev.map(obj => obj.id === targetObject.id ? { ...obj, isPhysicsEnabled: false, velocity: { x: 0, y: 0 } } : obj));
            } else {
              if (!canvasDragStartRef.current) canvasDragStartRef.current = { x: handX, y: handY };
            }
          }
        }

        if (isPinching) {
          const obj0 = newGrabbedObjects.get(0);
          const obj1 = newGrabbedObjects.get(1);
          
          if (obj0 && obj1 && obj0.id === obj1.id && handPositions.length === 2 && handPositions[0] && handPositions[1]) {
            // Two hands grabbing the same card - check for splitting
            const hand1X = handPositions[0].x * 100, hand1Y = handPositions[0].y * 100;
            const hand2X = handPositions[1].x * 100, hand2Y = handPositions[1].y * 100;
            const distance = Math.sqrt(Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2));
            
            // Track initial distance for split detection
            if (!splitDistanceRef.current.has(obj0.id)) {
              splitDistanceRef.current.set(obj0.id, distance);
            }
            
            const initialDistance = splitDistanceRef.current.get(obj0.id)!;
            const SPLIT_THRESHOLD = 15; // Distance increase needed to trigger split
            
            if (distance > initialDistance + SPLIT_THRESHOLD && !splittingCards.has(obj0.id)) {
              // Split the card into two
              const currentObj = objects.find(o => o.id === obj0.id);
              if (currentObj) {
                setSplittingCards(prev => new Set(prev).add(obj0.id));
                
                // Create two new cards from the split
                // Ensure we have valid default values for all properties
                const safeCurrentObj = {
                  ...currentObj,
                  position: currentObj.position || { x: 50, y: 50 },
                  rotation: currentObj.rotation || { x: 0, y: 0, z: 0 },
                  velocity: currentObj.velocity || { x: 0, y: 0 }
                };
                
                maxZIndexRef.current += 2;
                const newCard1: ObjectData = {
                  ...safeCurrentObj,
                  id: Date.now().toString(),
                  position: { x: hand1X - canvasOffset.x, y: hand1Y - canvasOffset.y },
                  zIndex: maxZIndexRef.current - 1,
                  title: safeCurrentObj.title ? safeCurrentObj.title + ' (A)' : 'Split Card A',
                  velocity: { x: 0, y: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  isPhysicsEnabled: false
                };
                const newCard2: ObjectData = {
                  ...safeCurrentObj,
                  id: (Date.now() + 1).toString(),
                  position: { x: hand2X - canvasOffset.x, y: hand2Y - canvasOffset.y },
                  zIndex: maxZIndexRef.current,
                  title: safeCurrentObj.title ? safeCurrentObj.title + ' (B)' : 'Split Card B',
                  velocity: { x: 0, y: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  isPhysicsEnabled: false
                };
                
                // Remove original card and add split cards
                setObjects(prev => [...prev.filter(o => o.id !== obj0.id), newCard1, newCard2]);
                
                // Update grabbed objects to point to new cards
                newGrabbedObjects.set(0, { id: newCard1.id, offsetX: 0, offsetY: 0 });
                newGrabbedObjects.set(1, { id: newCard2.id, offsetX: 0, offsetY: 0 });
                hasChanges = true;
                
                splitDistanceRef.current.delete(obj0.id);
                baseDistanceRef.current.delete(obj0.id);
                baseAngleRef.current.delete(obj0.id);
                
                setTimeout(() => {
                  setSplittingCards(prev => {
                    const next = new Set(prev);
                    next.delete(obj0.id);
                    return next;
                  });
                }, 500);
                
                toast({ title: "Card split!", description: "Card divided into two" });
              }
            } else {
              // Normal two-hand manipulation (scale and rotate) - DISABLED
              // Resize disabled per user request
            }
          } else if (obj0 && obj1 && obj0.id !== obj1.id && handPositions.length === 2) {
            // Two hands grabbing different cards - check for merging
            const card1 = objects.find(o => o.id === obj0.id);
            const card2 = objects.find(o => o.id === obj1.id);
            
            if (card1 && card2 && card1.position && card2.position) {
              // Ensure positions are valid objects with x and y properties
              const safePos1 = card1.position || { x: 50, y: 50 };
              const safePos2 = card2.position || { x: 50, y: 50 };
              
              const pos1X = safePos1.x + canvasOffset.x;
              const pos1Y = safePos1.y + canvasOffset.y;
              const pos2X = safePos2.x + canvasOffset.x;
              const pos2Y = safePos2.y + canvasOffset.y;
              const distance = Math.sqrt(Math.pow(pos2X - pos1X, 2) + Math.pow(pos2Y - pos1Y, 2));
              
              const MERGE_THRESHOLD = 15; // Distance to trigger merge
              
              if (distance < MERGE_THRESHOLD && !mergingCards.has(obj0.id) && !mergingCards.has(obj1.id)) {
                // Merge the two cards
                setMergingCards(prev => new Set([...prev, obj0.id, obj1.id]));
                
                maxZIndexRef.current += 1;
                const mergedCard: ObjectData = {
                  id: Date.now().toString(),
                  type: card1.type,
                  title: `${card1.title || 'Card'} + ${card2.title || 'Card'}`,
                  description: 'Merged card',
                  fileUrl: card1.fileUrl,
                  position: {
                    x: (safePos1.x + safePos2.x) / 2,
                    y: (safePos1.y + safePos2.y) / 2,
                  },
                  zIndex: maxZIndexRef.current,
                  rotation: { x: 0, y: 0, z: 0 },
                  velocity: { x: 0, y: 0 },
                  isPhysicsEnabled: false,
                };
                
                // Remove both cards and add merged card
                setObjects(prev => [...prev.filter(o => o.id !== obj0.id && o.id !== obj1.id), mergedCard]);
                
                // Clear grabbed objects
                newGrabbedObjects.delete(0);
                newGrabbedObjects.delete(1);
                hasChanges = true;
                
                setTimeout(() => {
                  setMergingCards(prev => {
                    const next = new Set(prev);
                    next.delete(obj0.id);
                    next.delete(obj1.id);
                    return next;
                  });
                }, 500);
                
                toast({ title: "Cards merged!", description: "Two cards combined into one" });
              } else {
                // Move both cards independently
                const grabbed0 = newGrabbedObjects.get(0);
                const grabbed1 = newGrabbedObjects.get(1);
                
                if (!handPositions[0] || !handPositions[1]) return;
                
                const hand1X = handPositions[0].x * 100, hand1Y = handPositions[0].y * 100;
                const hand2X = handPositions[1].x * 100, hand2Y = handPositions[1].y * 100;
                
                if (grabbed0) {
                  objectUpdates.set(grabbed0.id, { 
                    ...(objectUpdates.get(grabbed0.id) || {}), 
                    position: { 
                      x: hand1X - grabbed0.offsetX - canvasOffset.x, 
                      y: hand1Y - grabbed0.offsetY - canvasOffset.y 
                    } 
                  });
                }
                if (grabbed1) {
                  objectUpdates.set(grabbed1.id, { 
                    ...(objectUpdates.get(grabbed1.id) || {}), 
                    position: { 
                      x: hand2X - grabbed1.offsetX - canvasOffset.x, 
                      y: hand2Y - grabbed1.offsetY - canvasOffset.y 
                    } 
                  });
                }
              }
            }
          } else {
            // Single hand grab - move card with hand
            const grabbed = newGrabbedObjects.get(handIndex);
            if (grabbed) {
              const hand = handPositions[handIndex];
              if (hand) {
                objectUpdates.set(grabbed.id, { 
                  ...(objectUpdates.get(grabbed.id) || {}), 
                  position: { 
                    x: handX - grabbed.offsetX - canvasOffset.x, 
                    y: handY - grabbed.offsetY - canvasOffset.y 
                  } 
                });
              }
            }
          }
        }

        if (!isPinching && wasPinching) {
          const grabbed = newGrabbedObjects.get(handIndex);
          if (grabbed) {
            // Delete zone disabled
            /* 
            // Check if object is over delete zone before releasing
            const obj = objects.find(o => o.id === grabbed.id);
            if (obj) {
              const objX = obj.position.x + canvasOffset.x;
              const objY = obj.position.y + canvasOffset.y;
              const DELETE_ZONE_X = 85;
              const DELETE_ZONE_Y = 75;
              
              if (objX >= DELETE_ZONE_X && objX <= 95 && objY >= DELETE_ZONE_Y && objY <= 85) {
                // Delete the object
                setObjects(prev => prev.filter(o => o.id !== grabbed.id));
                toast({ title: "Card deleted", description: "Card moved to trash" });
                newGrabbedObjects.delete(handIndex);
                hasChanges = true;
                baseDistanceRef.current.delete(grabbed.id);
                baseAngleRef.current.delete(grabbed.id);
                splitDistanceRef.current.delete(grabbed.id);
                handVelocityHistoryRef.current.delete(handIndex);
                return;
              }
            }
            */
            
            newGrabbedObjects.delete(handIndex);
            hasChanges = true;
            if (!Array.from(newGrabbedObjects.values()).some(g => g.id === grabbed.id)) {
              baseDistanceRef.current.delete(grabbed.id);
              baseAngleRef.current.delete(grabbed.id);
              splitDistanceRef.current.delete(grabbed.id);
              
              // Calculate release velocity from hand movement history
              const history = handVelocityHistoryRef.current.get(handIndex) || [];
              let velocityX = 0;
              let velocityY = 0;
              
              if (history.length >= 2) {
                const recent = history[history.length - 1];
                const previous = history[0];
                const timeDelta = (recent.timestamp - previous.timestamp) / 1000; // Convert to seconds
                
                if (timeDelta > 0) {
                  // Calculate velocity in percentage points per second
                  velocityX = (recent.x - previous.x) / timeDelta;
                  velocityY = (recent.y - previous.y) / timeDelta;
                  
                  // Scale down velocity for smoother motion (multiply by frame time)
                  const VELOCITY_SCALE = 0.016; // Assume 60fps frame time
                  velocityX *= VELOCITY_SCALE;
                  velocityY *= VELOCITY_SCALE;
                }
              }
              
              setObjects(prev => prev.map(obj => obj.id === grabbed.id ? { 
                ...obj, 
                isPhysicsEnabled: true, 
                velocity: { x: velocityX, y: velocityY } 
              } : obj));
              
              // Clear velocity history for this hand
              handVelocityHistoryRef.current.delete(handIndex);
            }
          }
          
          // Only reset canvas drag if ALL hands have stopped pinching
          const anyHandStillPinching = handPositions.some((_, idx) => {
            const gesture = gestureStates[idx];
            return gesture && gesture.isPinching;
          });
          
          if (!anyHandStillPinching && newGrabbedObjects.size === 0) {
            canvasDragStartRef.current = null;
            canvasZoomBaseDistanceRef.current = null;
          }
        }
        lastPinchStates.current.set(handIndex, isPinching);
      });

      // Delete zone disabled
      /*
      // Update show delete zone based on whether anything is being grabbed or touched
      setShowDeleteZone(newGrabbedObjects.size > 0 || newTouchedObjects.size > 0);
      
      // Check collision with delete zone for grabbed or touched objects
      let isAnyObjectOverDeleteZone = false;
      const DELETE_ZONE_X = 85; // Bottom right: 85-95%
      const DELETE_ZONE_Y = 75; // Bottom: 75-85%
      
      // Check grabbed objects (pinch drag) - use updated positions
      newGrabbedObjects.forEach((grabbed) => {
        const obj = objects.find(o => o.id === grabbed.id);
        if (obj) {
          // Use updated position if available, otherwise use current position
          const update = objectUpdates.get(grabbed.id);
          const objX = update?.position ? update.position.x + canvasOffset.x : obj.position.x + canvasOffset.x;
          const objY = update?.position ? update.position.y + canvasOffset.y : obj.position.y + canvasOffset.y;
          
          if (objX >= DELETE_ZONE_X && objX <= 95 && objY >= DELETE_ZONE_Y && objY <= 85) {
            isAnyObjectOverDeleteZone = true;
          }
        }
      });
      
      // Check touched objects (touch drag) - use updated positions
      newTouchedObjects.forEach((touched) => {
        const obj = objects.find(o => o.id === touched.id);
        if (obj) {
          // Use updated position if available, otherwise use current position
          const update = objectUpdates.get(touched.id);
          const objX = update?.position ? update.position.x + canvasOffset.x : obj.position.x + canvasOffset.x;
          const objY = update?.position ? update.position.y + canvasOffset.y : obj.position.y + canvasOffset.y;
          
          if (objX >= DELETE_ZONE_X && objX <= 95 && objY >= DELETE_ZONE_Y && objY <= 85) {
            isAnyObjectOverDeleteZone = true;
          }
        }
      });
      
      setIsOverDeleteZone(isAnyObjectOverDeleteZone);
      */
      
      if (hasChanges) setGrabbedObjects(newGrabbedObjects);
      if (hasTouchChanges) touchedObjects.current = newTouchedObjects;
      if (scaleUpdate) {
        // Two-hand scale (not removed, just single-hand z-scale removed)
        setObjects(prev => prev.map(obj => obj.id === scaleUpdate.id ? { ...obj, rotation: { ...obj.rotation } } : obj));
      }
      if (objectUpdates.size > 0) setObjects(prev => prev.map(obj => {
        const u = objectUpdates.get(obj.id);
        
        // ALWAYS ensure position, rotation, and velocity have valid values
        // Even for objects without updates, to prevent null reference errors
        const currentPosition = obj.position || { x: 50, y: 50 };
        const currentRotation = obj.rotation || { x: 0, y: 0, z: 0 };
        const currentVelocity = obj.velocity || { x: 0, y: 0 };
        
        if (!u) {
          // No update, but ensure object has valid position/rotation/velocity
          return {
            ...obj,
            position: currentPosition,
            rotation: currentRotation,
            velocity: currentVelocity
          };
        }
        
        // Update exists, merge with guaranteed valid values
        const newPosition = u.position || currentPosition;
        const newRotation = u.rotation || currentRotation;
        const newVelocity = currentVelocity; // Keep existing velocity
        
        return { 
          ...obj, 
          ...u, 
          position: newPosition, 
          rotation: newRotation,
          velocity: newVelocity
        };
      }));
    };

    animationFrameRef.current = requestAnimationFrame(updateDrag);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [handPositions, gestureStates, grabbedObjects, objects, toast]);

  // Handle connector interactions
  const handleConnectorGrab = useCallback((connectorId: string) => {
    const [cardId, position] = connectorId.split('-');
    setActiveWire({ startCardId: cardId, startConnector: position, handIndex: 0 });
  }, []);

  const getConnectorPosition = (cardId: string, connector: string) => {
    const card = objects.find(obj => obj.id === cardId);
    if (!card) return { x: 0, y: 0 };
    
    const cardX = (card.position.x + canvasOffset.x) * window.innerWidth / 100;
    const cardY = (card.position.y + canvasOffset.y) * window.innerHeight / 100;
    
    // Offset for connector position with 50px padding
    // Approximate card content width ~256px + 100px padding = ~356px total
    const cardWidth = 356;
    const cardHeight = card.type === 'card' ? 180 : 320; // Height with 50px padding
    
    switch (connector) {
      case 'left':
        return { x: cardX - cardWidth / 2, y: cardY };
      case 'right':
        return { x: cardX + cardWidth / 2, y: cardY };
      case 'top':
        return { x: cardX, y: cardY - cardHeight / 2 };
      case 'bottom':
        return { x: cardX, y: cardY + cardHeight / 2 };
      default:
        return { x: cardX, y: cardY };
    }
  };

  // Check if hand is hovering over any connector
  const checkConnectorHover = useCallback((handX: number, handY: number): string | null => {
    if (!showConnectors) return null;
    
    const CONNECTOR_THRESHOLD = 8; // Distance threshold in percentage
    
    for (const obj of objects) {
      if (obj.type !== 'card') continue;
      
      const connectors = ['left', 'right', 'top', 'bottom'];
      for (const conn of connectors) {
        const connectorId = `${obj.id}-${conn}`;
        const cardX = obj.position.x + canvasOffset.x;
        const cardY = obj.position.y + canvasOffset.y;
        
        // Calculate connector position in percentage
        let connX = cardX;
        let connY = cardY;
        
        switch (conn) {
          case 'left':
            connX = cardX - 18; // Adjusted for 50px padding card
            break;
          case 'right':
            connX = cardX + 18;
            break;
          case 'top':
            connY = cardY - 9; // Adjusted for 50px padding card
            break;
          case 'bottom':
            connY = cardY + 9;
            break;
        }
        
        const distance = Math.sqrt(
          Math.pow(handX - connX, 2) + Math.pow(handY - connY, 2)
        );
        
        if (distance < CONNECTOR_THRESHOLD) {
          return connectorId;
        }
      }
    }
    
    return null;
  }, [objects, canvasOffset, showConnectors]);

  // Update wire end position based on hand position when actively dragging
  useEffect(() => {
    if (!activeWire || handPositions.length === 0 || !showConnectors) return;
    
    const hand = handPositions[activeWire.handIndex];
    if (!hand) return;
    
    // Check if hand releases (stops pinching)
    const gesture = gestureStates[activeWire.handIndex];
    if (gesture && !gesture.isPinching) {
      // Check if near any connector to complete connection
      const handX = hand.x * 100;
      const handY = hand.y * 100;
      const hoveredConn = checkConnectorHover(handX, handY);
      
      if (hoveredConn) {
        const [targetCardId, targetConnector] = hoveredConn.split('-');
        
        // Can't connect to the same card or if it's the same connector we started from
        if (targetCardId !== activeWire.startCardId) {
          // Create connection
          setConnections(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              fromCardId: activeWire.startCardId,
              fromConnector: activeWire.startConnector,
              toCardId: targetCardId,
              toConnector: targetConnector,
            }
          ]);
          toast({
            title: "Connection created",
            description: `Connected ${activeWire.startCardId} to ${targetCardId}`,
          });
        }
      }
      
      setActiveWire(null);
    }
  }, [activeWire, handPositions, gestureStates, checkConnectorHover, toast, showConnectors]);

  // Physics loop disabled - cards no longer have inertia
  useEffect(() => {
    // Inertia disabled per user request
    return () => {};
  }, []);

  return (
    <div 
      className="relative min-h-screen bg-background overflow-hidden"
      style={canvasBackground ? {
        backgroundImage: `url(${canvasBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : undefined}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" style={{ opacity: canvasBackground ? 0.3 : 1 }} />
      <div className="relative z-10">
        {!isTracking ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="text-center space-y-6 max-w-2xl">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Spatial UI Controller</h1>
              <p className="text-xl text-muted-foreground">Control your interface with natural hand gestures</p>
              <div className="space-y-4 pt-8">
                <div className="glass-panel p-6 text-left space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Available Gestures:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /><span><strong className="text-primary">Point:</strong> Move your index finger to control the cursor</span></li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-secondary" /><span><strong className="text-secondary">Pinch:</strong> Touch thumb and index finger to click</span></li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent" /><span><strong className="text-accent">Touch Drag:</strong> Point with closed fist and move closer to drag cards</span></li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary" /><span><strong className="text-primary">Merge:</strong> Pinch two cards and bring them close together</span></li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-secondary" /><span><strong className="text-secondary">Split:</strong> Pinch one card with both hands and pull apart</span></li>
                  </ul>
                </div>
                <Button onClick={handleStartTracking} disabled={!isReady} size="lg" className="text-lg px-8 py-6 neon-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isReady ? 'Start Hand Tracking' : 'Loading Model...'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative min-h-screen">
            <video ref={videoRef} autoPlay playsInline muted className="fixed -left-[9999px] opacity-0 pointer-events-none" />
            
            {/* Bottom center buttons - pointer-events-auto ensures they're clickable */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-auto">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.gltf,.glb,.obj,.fbx" onChange={handleFileImport} className="hidden" />
              <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
              <Button 
                ref={restartButtonRef}
                onClick={handleRestart} 
                size="lg" 
                variant="destructive"
                className={`rounded-full neon-glow transition-all duration-200 px-6 py-6 ${isRestartButtonHovered ? 'scale-110 ring-2 ring-primary' : ''}`}
              >
                <RotateCcw className="w-5 h-5 mr-2" />Restart
              </Button>
              <Button 
                ref={importButtonRef}
                onClick={() => fileInputRef.current?.click()} 
                size="lg" 
                className={`rounded-full neon-glow transition-all duration-200 px-6 py-6 ${isImportButtonHovered ? 'scale-110 ring-2 ring-primary' : ''}`}
              >
                <Plus className="w-5 h-5 mr-2" />Import File
              </Button>
              <Button 
                onClick={() => backgroundInputRef.current?.click()} 
                size="lg" 
                variant="outline"
                className="rounded-full neon-glow transition-all duration-200 px-6 py-6"
              >
                <Image className="w-5 h-5 mr-2" />Background
              </Button>
              <Button 
                onClick={() => setShowConnectors(!showConnectors)} 
                size="lg" 
                variant="outline"
                className="rounded-full neon-glow transition-all duration-200 px-6 py-6"
              >
                <Link className="w-5 h-5 mr-2" />{showConnectors ? 'Hide' : 'Show'} Connectors
              </Button>
              <Button 
                onClick={() => setShow3DHand(!show3DHand)} 
                size="lg" 
                variant="outline"
                className="rounded-full neon-glow transition-all duration-200 px-6 py-6"
              >
                {show3DHand ? <Eye className="w-5 h-5 mr-2" /> : <EyeOff className="w-5 h-5 mr-2" />}
                3D Hand
              </Button>
              <Button 
                onClick={() => setShowSkeleton(!showSkeleton)} 
                size="lg" 
                variant="outline"
                className="rounded-full neon-glow transition-all duration-200 px-6 py-6"
              >
                {showSkeleton ? <Eye className="w-5 h-5 mr-2" /> : <EyeOff className="w-5 h-5 mr-2" />}
                Skeleton
              </Button>
              <Button 
                onClick={() => setShowSettings(!showSettings)} 
                size="lg" 
                variant="outline"
                className="rounded-full neon-glow transition-all duration-200 px-6 py-6"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
            <div className="absolute inset-0 origin-center transition-transform duration-200" style={{ transform: `scale(${canvasZoom})`, willChange: 'transform' }}>
              {objects.sort((a, b) => a.zIndex - b.zIndex).map((obj) => {
                const isBeingDragged = Array.from(grabbedObjects.values()).some(g => g.id === obj.id);
                const handIndex = Array.from(grabbedObjects.entries()).find(([_, g]) => g.id === obj.id)?.[0];
                const isMerging = mergingCards.has(obj.id);
                const isSplitting = splittingCards.has(obj.id);
                
                // Apply alignment offset to hand position for accurate interaction
                let adjustedHandPosition = handIndex !== undefined ? handPositions[handIndex] : null;
                if (adjustedHandPosition && landmarks && landmarks[handIndex]) {
                  const hand = landmarks[handIndex];
                  const thumb = hand[4];
                  const pinky = hand[17];
                  const isLeftHand = thumb.x > pinky.x;
                  const handParams = isLeftHand ? alignmentParams.leftHand : alignmentParams.rightHand;
                  
                  // Offset is already in percentage, just apply it directly
                  // Convert from viewport percentage to screen percentage
                  const offsetXPercent = (handParams.skeletonXOffset / window.innerWidth) * 100;
                  const offsetYPercent = (handParams.skeletonYOffset / window.innerHeight) * 100;
                  
                  adjustedHandPosition = {
                    ...adjustedHandPosition,
                    x: adjustedHandPosition.x + offsetXPercent,
                    y: adjustedHandPosition.y + offsetYPercent,
                  };
                }
                
                return <InteractiveObject 
                  key={obj.id} 
                  id={obj.id} 
                  type={obj.type} 
                  title={obj.title} 
                  description={obj.description} 
                  fileUrl={obj.fileUrl} 
                  position={{ x: obj.position.x + canvasOffset.x, y: obj.position.y + canvasOffset.y }} 
                  rotation={obj.rotation} 
                  zIndex={obj.zIndex} 
                  handPosition={adjustedHandPosition} 
                  gestureState={handIndex !== undefined ? gestureStates[handIndex] : { isPinching: false, isPointing: false, pinchStrength: 0, handIndex: 0, fingers: { thumb: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, index: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, middle: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, ring: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, pinky: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } } } }} 
                  onInteract={() => {}} 
                  isBeingDragged={isBeingDragged} 
                  scale={1} 
                  isMerging={isMerging} 
                  isSplitting={isSplitting} 
                  allHandPositions={handPositions} 
                  allGestureStates={gestureStates}
                  onConnectorGrab={handleConnectorGrab}
                  activeConnector={activeWire ? `${activeWire.startCardId}-${activeWire.startConnector}` : null}
                  hoveredConnector={hoveredConnector}
                  onConnectorHover={setHoveredConnector}
                  showConnectors={showConnectors}
                />;
              })}
              
              {/* Render wire connections */}
              {showConnectors && connections.map((conn) => {
                const startPos = getConnectorPosition(conn.fromCardId, conn.fromConnector);
                const endPos = getConnectorPosition(conn.toCardId, conn.toConnector);
                return (
                  <WireConnection
                    key={conn.id}
                    startX={startPos.x}
                    startY={startPos.y}
                    endX={endPos.x}
                    endY={endPos.y}
                  />
                );
              })}
              
              {/* Render active wire being dragged */}
              {activeWire && handPositions[activeWire.handIndex] && showConnectors && (
                <WireConnection
                  startX={getConnectorPosition(activeWire.startCardId, activeWire.startConnector).x}
                  startY={getConnectorPosition(activeWire.startCardId, activeWire.startConnector).y}
                  endX={handPositions[activeWire.handIndex].x * window.innerWidth}
                  endY={handPositions[activeWire.handIndex].y * window.innerHeight}
                  isActive
                />
              )}
            </div>
            {show3DHand && (
              <>
                {/* Show placeholder hands only before tracking starts */}
                {!hasStartedTracking && (
                  <div className="fixed top-0 left-0 right-0 pointer-events-none opacity-50 flex flex-col items-center pt-8 animate-float">
                    <div className="relative w-full h-64">
                      <Hand3DModel 
                        landmarks={[createPlaceholderHandLandmarks('Left'), createPlaceholderHandLandmarks('Right')]} 
                        videoWidth={window.innerWidth} 
                        videoHeight={window.innerHeight} 
                        alignmentParams={{
                          leftHand: {
                            ...alignmentParams.leftHand,
                            hand3DScale: alignmentParams.leftHand.hand3DScale * 0.5,
                            hand3DXOffset: -8,
                            hand3DYOffset: -35,
                          },
                          rightHand: {
                            ...alignmentParams.rightHand,
                            hand3DScale: alignmentParams.rightHand.hand3DScale * 0.5,
                            hand3DXOffset: 8,
                            hand3DYOffset: -35,
                          }
                        }}
                        handedness={[{index: 0, categoryName: 'Left', displayName: 'Left', score: 1}, {index: 1, categoryName: 'Right', displayName: 'Right', score: 1}]}
                      />
                    </div>
                    <p className="text-foreground/70 text-sm font-medium mt-2">Show Hands</p>
                  </div>
                )}
                {/* Live tracked hands */}
                {landmarks && landmarks.length > 0 && (
                  <Hand3DModel 
                    landmarks={landmarks} 
                    videoWidth={window.innerWidth} 
                    videoHeight={window.innerHeight} 
                    alignmentParams={alignmentParams} 
                    handedness={handedness} 
                  />
                )}
              </>
            )}
            {showSkeleton && landmarks && landmarks.length > 0 && <HandSkeleton landmarks={landmarks} videoWidth={window.innerWidth} videoHeight={window.innerHeight} alignmentParams={alignmentParams} handedness={handedness} />}
            
            {/* Delete Zone - disabled
            {showDeleteZone && (
              <div 
                className="fixed bottom-8 right-8 z-40 pointer-events-none"
                style={{
                  width: '150px',
                  height: '150px',
                }}
              >
                <div 
                  className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOverDeleteZone 
                      ? 'bg-destructive/90 scale-110 shadow-2xl shadow-destructive/50' 
                      : 'bg-destructive/70 scale-100'
                  }`}
                >
                  <Trash2 
                    className={`transition-all duration-300 ${
                      isOverDeleteZone ? 'w-20 h-20' : 'w-16 h-16'
                    }`} 
                    strokeWidth={2}
                    color="white"
                  />
                </div>
              </div>
            )}
            */}
            
            {/* Alignment Settings Panel */}
            {showSettings && (
              <div className="fixed top-8 right-8 z-50">
                <AlignmentSettings params={alignmentParams} onParamsChange={setAlignmentParams} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
