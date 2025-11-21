import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useRemoteGestures } from '@/hooks/useRemoteGestures';
import { supabase } from '@/integrations/supabase/client';
import HandSkeleton from '@/components/HandSkeleton';
import Hand3DModel from '@/components/Hand3DModel';
import InteractiveObject from '@/components/InteractiveObject';
import AlignmentSettings, { AlignmentParams } from '@/components/AlignmentSettings';
import WireConnection from '@/components/WireConnection';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Scene3D } from '@/components/Scene3D';
import { ObjectManipulationIndicator } from '@/components/ObjectManipulationIndicator';
import { DeleteZone } from '@/components/DeleteZone';
import { CardHoldDeleteButton } from '@/components/CardHoldDeleteButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GesturesInfo } from '@/components/GesturesInfo';
import { QRCodeConnection } from '@/components/QRCodeConnection';
import { DebugPanel } from '@/components/DebugPanel';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus } from 'lucide-react';

interface ObjectData {
  id: string;
  type: 'card' | 'image' | 'pdf' | 'model3d' | 'obj';
  title?: string;
  description?: string;
  fileUrl?: string;
  position: { x: number; y: number; z?: number };
  zIndex: number;
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  isPhysicsEnabled: boolean;
  scale?: number;
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

// Random words for card titles
const CARD_WORDS = [
  'Spark', 'Wave', 'Echo', 'Flow', 'Drift', 'Pulse', 'Bloom', 'Shift', 'Glow', 'Breeze',
  'Ripple', 'Flare', 'Surge', 'Frost', 'Dawn', 'Ember', 'Mist', 'Storm', 'Zen', 'Aura',
  'Dream', 'Void', 'Nova', 'Shade', 'Prism', 'Tide', 'Vibe', 'Halo', 'Nexus', 'Zephyr',
  'Nexus', 'Cipher', 'Flux', 'Orbit', 'Pixel', 'Echo', 'Matrix', 'Quantum', 'Nebula', 'Crystal'
];

const getRandomWord = () => CARD_WORDS[Math.floor(Math.random() * CARD_WORDS.length)];
const getRandomPosition = () => ({
  x: Math.random() * 70 + 15, // Random x between 15% and 85%
  y: Math.random() * 60 + 20  // Random y between 20% and 80%
});

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [remoteLandmarks, setRemoteLandmarks] = useState<any>(null);
  const [remoteHandedness, setRemoteHandedness] = useState<any>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [trackingMode, setTrackingMode] = useState<'initial' | 'mobile-qr' | 'local'>('initial');
  const channelRef = useRef<any>(null);
  const { isReady, handPositions: localHandPositions, gestureStates: localGestureStates, landmarks, handedness, videoRef, startCamera } = useHandTracking(trackingMode !== 'mobile-qr');
  const { handPositions: remoteHandPositions, gestureStates: remoteGestureStates } = useRemoteGestures(remoteLandmarks, remoteHandedness);
  
  // Use remote gestures if available, otherwise use local
  const handPositions = remoteLandmarks && remoteLandmarks.length > 0 ? remoteHandPositions : localHandPositions;
  const gestureStates = remoteLandmarks && remoteLandmarks.length > 0 ? remoteGestureStates : localGestureStates;
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
  const objInputRef = useRef<HTMLInputElement>(null);
  const [grabbedObjects, setGrabbedObjects] = useState<Map<number, { id: string; offsetX: number; offsetY: number; }>>(new Map());
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const lastPinchStates = useRef<Map<number, boolean>>(new Map());
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
  const [show3DHand, setShow3DHand] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showPlane, setShowPlane] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [holdingCardId, setHoldingCardId] = useState<string | null>(null);
  const [showHoldDeleteButton, setShowHoldDeleteButton] = useState<string | null>(null);
  const holdStartTimeRef = useRef<Map<string, number>>(new Map());
  const holdStartPositionRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [resizingCardId, setResizingCardId] = useState<string | null>(null);
  const cardBaseScaleRef = useRef<Map<string, number>>(new Map());
  const [isPlusButtonHovered, setIsPlusButtonHovered] = useState(false);
  const [isPlusButtonClicked, setIsPlusButtonClicked] = useState(false);
  const plusButtonCooldownRef = useRef<number>(0);
  
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

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('spatialUISettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.alignmentParams) {
          setAlignmentParams(parsed.alignmentParams);
        }
        if (typeof parsed.showConnectors === 'boolean') {
          setShowConnectors(parsed.showConnectors);
        }
        if (typeof parsed.show3DHand === 'boolean') {
          setShow3DHand(parsed.show3DHand);
        }
        if (typeof parsed.showSkeleton === 'boolean') {
          setShowSkeleton(parsed.showSkeleton);
        }
        if (typeof parsed.showPlane === 'boolean') {
          setShowPlane(parsed.showPlane);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().split('T')[1]?.split('.')[0] ?? '';
    const entry = `[DESKTOP ${timestamp}] ${message}`;
    console.log(entry);
    setDebugLogs((prev) => [...prev.slice(-49), entry]);
  }, []);

  // Set up realtime channel to receive landmarks from mobile
  useEffect(() => {
    if (!sessionId || trackingMode !== 'mobile-qr') return;

    let mounted = true;
    let hasAutoStarted = false;

    const setupChannel = async () => {
      try {
        // Check if already signed in to avoid rate limit
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && mounted) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            // If rate limited, wait and the channel will work anyway with existing connection
            if (error.status === 429) {
              addDebugLog('Rate limited, using existing connection');
            } else {
              console.error('Auth error:', error);
              addDebugLog(`Auth error: ${error.message}`);
              return;
            }
          } else {
            addDebugLog('Anonymous auth successful');
          }
        } else {
          addDebugLog('Using existing auth session');
        }

        if (!mounted) return;

        addDebugLog(`Setting up landmark channel for session ${sessionId}`);
        
        const channel = supabase.channel(`hand-tracking-${sessionId}`, {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel
          .on('broadcast', { event: 'landmarks' }, ({ payload }: any) => {
            if (!mounted) return;
            setRemoteLandmarks(payload.landmarks);
            setRemoteHandedness(payload.handedness);
            if (!isRemoteConnected) {
              setIsRemoteConnected(true);
              addDebugLog('Receiving landmarks from mobile');
              toast({
                title: "Phone Connected",
                description: "Receiving hand tracking data from your phone",
              });
              // Auto-start tracking when first landmark arrives
              if (!hasAutoStarted) {
                hasAutoStarted = true;
                setIsTracking(true);
                setHasStartedTracking(true);
                addDebugLog('Auto-started tracking from mobile connection');
              }
            }
          })
          .subscribe((status) => {
            if (!mounted) return;
            addDebugLog(`Landmark channel status: ${status}`);
            if (status === 'SUBSCRIBED') {
              addDebugLog('Desktop ready to receive landmarks');
            }
          });
      } catch (error) {
        console.error('Setup error:', error);
        addDebugLog(`Setup error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    };

    setupChannel();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, trackingMode, addDebugLog, isRemoteConnected, toast]);

  const handleStartTracking = async () => {
    addDebugLog('handleStartTracking called');
    setIsTracking(true);
    setHasStartedTracking(true);
    
    // Always start local camera for desktop interaction
    // It will be used when no mobile session is active
    setTimeout(async () => { 
      if (videoRef.current) {
        if (!sessionId || !isRemoteConnected) {
          // Use local camera when no phone session or not connected
          addDebugLog('Starting local camera for desktop interaction');
          await startCamera();
        } else {
          addDebugLog('Phone session active, using remote landmarks');
        }
      } else {
        console.error('Video element not ready, retrying...');
        // Retry after another delay
        setTimeout(async () => {
          if (videoRef.current) {
            await startCamera();
          } else {
            console.error('Failed to initialize video element');
            toast({
              title: "Camera Error",
              description: "Failed to access video element. Please refresh and try again.",
              variant: "destructive"
            });
          }
        }, 500);
      }
    }, 300);
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

  const handleAddCard = useCallback(() => {
    maxZIndexRef.current += 1;
    const newCard: ObjectData = {
      id: Date.now().toString(),
      type: 'card',
      title: 'New Card',
      description: 'Click to edit',
      position: { x: 50, y: 50 },
      zIndex: maxZIndexRef.current,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    };
    
    setObjects(prev => [...prev, newCard]);
    toast({ title: "Card added!", description: "New card created" });
  }, [toast]);

  const handleDeleteCard = useCallback(() => {
    // Find the card currently being grabbed by any hand
    const currentGrabbedCardIds = Array.from(grabbedObjects.values()).map(g => g.id);
    
    if (currentGrabbedCardIds.length === 0) {
      toast({ title: "No card selected", description: "Please grab a card with pinch to delete it" });
      return;
    }
    
    // Delete all grabbed cards
    setObjects(prev => prev.filter(obj => !currentGrabbedCardIds.includes(obj.id)));
    setGrabbedObjects(new Map());
    
    toast({ 
      title: "Card deleted!", 
      description: `${currentGrabbedCardIds.length} card${currentGrabbedCardIds.length > 1 ? 's' : ''} deleted` 
    });
  }, [grabbedObjects, toast]);

  const handleClearAll = useCallback(() => {
    setObjects([]);
    setConnections([]);
    setGrabbedObjects(new Map());
    toast({ 
      title: "Canvas cleared!", 
      description: "All cards removed" 
    });
  }, [toast]);

  const handleOBJImport = useCallback((file: File, fileName: string) => {
    // Read file and create blob with correct MIME type for OBJ files
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const fileUrl = URL.createObjectURL(blob);
        maxZIndexRef.current += 1;
        
        const newObject: ObjectData = {
          id: Date.now().toString(),
          type: 'obj',
          title: fileName,
          fileUrl,
          position: { x: 0, y: 0, z: 0 }, // 3D position
          zIndex: maxZIndexRef.current,
          rotation: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0 },
          isPhysicsEnabled: false,
          scale: 1,
        };
        
        setObjects(prev => [...prev, newObject]);
        toast({
          title: "Object imported",
          description: `${fileName} loaded successfully`,
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleOBJFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.obj')) {
      toast({
        title: "Invalid file",
        description: "Please select an OBJ file",
        variant: "destructive",
      });
      return;
    }

    handleOBJImport(file, file.name);
    
    // Reset input
    if (objInputRef.current) {
      objInputRef.current.value = '';
    }
  }, [handleOBJImport, toast]);

  const handleUpdate3DObject = useCallback((id: string, updates: Partial<ObjectData>) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('spatialUISettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (typeof settings.showConnectors === 'boolean') setShowConnectors(settings.showConnectors);
        if (typeof settings.show3DHand === 'boolean') setShow3DHand(settings.show3DHand);
        if (typeof settings.showSkeleton === 'boolean') setShowSkeleton(settings.showSkeleton);
        if (typeof settings.showPlane === 'boolean') setShowPlane(settings.showPlane);
      } catch (e) {
        console.error('Failed to load saved settings:', e);
      }
    }
  }, []);

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

      // Check hover state for plus button with all hands
      const plusButtonX = window.innerWidth / 2;
      const plusButtonY = 32 + 40; // top-8 (32px) + half button height (40px)
      const buttonRadius = 50; // Slightly larger for hover detection
      
      let isAnyHandOverButton = false;
      handPositions.forEach((handPos, handIndex) => {
        const handX = handPos.x * window.innerWidth;
        const handY = handPos.y * window.innerHeight;
        const distanceToPlusButton = Math.sqrt(
          Math.pow(handX - plusButtonX, 2) + 
          Math.pow(handY - plusButtonY, 2)
        );
        if (distanceToPlusButton < buttonRadius) {
          isAnyHandOverButton = true;
        }
      });
      setIsPlusButtonHovered(isAnyHandOverButton);

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
            
            // Check for 3D objects first (use world space coordinates)
            const target3DObject = objects.find((obj) => {
              if (obj.type !== 'obj') return false;
              
              // Convert hand position to 3D world space (same as Scene3D)
              const handWorldX = (handPos.x - 0.5) * 20;
              const handWorldY = -(handPos.y - 0.5) * 15;
              
              // Check distance in 3D space
              const distance = Math.sqrt(
                Math.pow(handWorldX - obj.position.x, 2) + 
                Math.pow(handWorldY - obj.position.y, 2)
              );
              
              return distance < 3; // Grab threshold in world units
            });
            
            // Check for 2D objects (cards, images, etc.) - exclude shaking cards
            const target2DObject = objects.find((obj) => {
               if (obj.type === 'obj') return false; // Skip 3D objects
               if (showHoldDeleteButton === obj.id) return false; // Skip shaking cards
               
               const adjustedX = obj.position.x + canvasOffset.x;
               const adjustedY = obj.position.y + canvasOffset.y;
               // Larger grab zone to allow grabbing near edges
               return Math.abs(handX - adjustedX) < 18 && Math.abs(handY - adjustedY) < 14;
             });
            
            const targetObject = target3DObject || target2DObject;

            if (targetObject) {
              const adjustedX = targetObject.position.x + canvasOffset.x;
              const adjustedY = targetObject.position.y + canvasOffset.y;
              newGrabbedObjects.set(handIndex, { id: targetObject.id, offsetX: handX - adjustedX, offsetY: handY - adjustedY });
              hasChanges = true;
              maxZIndexRef.current += 1;
              objectUpdates.set(targetObject.id, { ...(objectUpdates.get(targetObject.id) || {}), zIndex: maxZIndexRef.current });
              setObjects(prev => prev.map(obj => obj.id === targetObject.id ? { ...obj, isPhysicsEnabled: false, velocity: { x: 0, y: 0 } } : obj));
              
              // Track hold start time for delete functionality
              if (!holdStartTimeRef.current.has(targetObject.id)) {
                holdStartTimeRef.current.set(targetObject.id, Date.now());
                holdStartPositionRef.current.set(targetObject.id, { x: handX, y: handY });
              }
            } else {
              // Pinch-to-add card when pinching on the plus button (top center)
              const plusButtonX = window.innerWidth / 2;
              const plusButtonY = 32 + 40; // top-8 (32px) + half button height (40px)
              const buttonRadius = 50; // Detection radius
              
              const handScreenX = handX * window.innerWidth / 100;
              const handScreenY = handY * window.innerHeight / 100;
              
              const distanceToPlusButton = Math.sqrt(
                Math.pow(handScreenX - plusButtonX, 2) + 
                Math.pow(handScreenY - plusButtonY, 2)
              );
              
              // Check cooldown to prevent rapid-fire (very short cooldown)
              const now = Date.now();
              if (distanceToPlusButton < buttonRadius && now - plusButtonCooldownRef.current > 100) {
                plusButtonCooldownRef.current = now;
                maxZIndexRef.current += 1;
                const randomPos = getRandomPosition();
                const newCard: ObjectData = {
                  id: Date.now().toString() + handIndex,
                  type: 'card',
                  title: getRandomWord(),
                  description: 'Created with hand pinch',
                  position: randomPos,
                  zIndex: maxZIndexRef.current,
                  rotation: { x: 0, y: 0, z: 0 },
                  velocity: { x: 0, y: 0 },
                  isPhysicsEnabled: false,
                  scale: 0.5, // Start small for animation
                };
                setObjects(prev => [...prev, newCard]);
                // Animate scale up
                setTimeout(() => {
                  setObjects(prev => prev.map(obj => 
                    obj.id === newCard.id ? { ...obj, scale: 1 } : obj
                  ));
                }, 10);
                setIsPlusButtonClicked(true);
                setTimeout(() => setIsPlusButtonClicked(false), 200);
                toast({ title: "Card created!", description: "New card created with pinch gesture" });
              } else if (distanceToPlusButton >= buttonRadius) {
                // Pinch on canvas (not on button, not on object) - cancel shake mode if active
                if (showHoldDeleteButton) {
                  setShowHoldDeleteButton(null);
                  holdStartTimeRef.current.delete(showHoldDeleteButton);
                  holdStartPositionRef.current.delete(showHoldDeleteButton);
                } else {
                  // Start canvas drag when pinching on empty space (if not canceling shake)
                  if (!canvasDragStartRef.current) canvasDragStartRef.current = { x: handX, y: handY };
                }
              }
            }
          }
        }

        if (isPinching) {
          const obj0 = newGrabbedObjects.get(0);
          const obj1 = newGrabbedObjects.get(1);
          
          if (obj0 && obj1 && obj0.id === obj1.id && handPositions.length === 2 && handPositions[0] && handPositions[1]) {
            // Two hands grabbing the same card - check for resizing (for 2D cards) or splitting
            const currentObj = objects.find(o => o.id === obj0.id);
            const hand1X = handPositions[0].x * 100, hand1Y = handPositions[0].y * 100;
            const hand2X = handPositions[1].x * 100, hand2Y = handPositions[1].y * 100;
            const distance = Math.sqrt(Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2));
            
            if (currentObj && currentObj.type === 'card') {
              // Track initial distance for split detection
              if (!splitDistanceRef.current.has(obj0.id)) {
                splitDistanceRef.current.set(obj0.id, distance);
              }
              
              const initialDistance = splitDistanceRef.current.get(obj0.id)!;
              const SPLIT_THRESHOLD = 20; // Distance increase needed to trigger split
              
              // Check if hands are pulling apart for split
              if (distance > initialDistance + SPLIT_THRESHOLD && !splittingCards.has(obj0.id)) {
                // Split the card into two
                setSplittingCards(prev => new Set(prev).add(obj0.id));
                
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
                  isPhysicsEnabled: false,
                  scale: 1
                };
                const newCard2: ObjectData = {
                  ...safeCurrentObj,
                  id: (Date.now() + 1).toString(),
                  position: { x: hand2X - canvasOffset.x, y: hand2Y - canvasOffset.y },
                  zIndex: maxZIndexRef.current,
                  title: safeCurrentObj.title ? safeCurrentObj.title + ' (B)' : 'Split Card B',
                  velocity: { x: 0, y: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  isPhysicsEnabled: false,
                  scale: 1
                };
                
                setObjects(prev => [...prev.filter(o => o.id !== obj0.id), newCard1, newCard2]);
                newGrabbedObjects.set(0, { id: newCard1.id, offsetX: 0, offsetY: 0 });
                newGrabbedObjects.set(1, { id: newCard2.id, offsetX: 0, offsetY: 0 });
                hasChanges = true;
                
                setTimeout(() => {
                  setSplittingCards(prev => {
                    const next = new Set(prev);
                    next.delete(obj0.id);
                    return next;
                  });
                }, 500);
                
                toast({ title: "Card split!", description: "Card divided into two" });
              } else if (distance <= initialDistance + SPLIT_THRESHOLD) {
                // Two-hand card resizing when not pulling apart
                if (!cardBaseScaleRef.current.has(obj0.id)) {
                  cardBaseScaleRef.current.set(obj0.id, currentObj.scale || 1);
                }
                
                if (!baseDistanceRef.current.has(`resize-${obj0.id}`)) {
                  baseDistanceRef.current.set(`resize-${obj0.id}`, distance);
                }
                
                const baseDistance = baseDistanceRef.current.get(`resize-${obj0.id}`)!;
                const baseScale = cardBaseScaleRef.current.get(obj0.id)!;
                const scaleFactor = distance / baseDistance;
                const newScale = Math.max(0.5, Math.min(3, baseScale * scaleFactor));
                
                setResizingCardId(obj0.id);
                scaleUpdate = { id: obj0.id, scale: newScale };
              }
            } else {
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
            // Single hand grab - move card with hand and check delete zone
            const grabbed = newGrabbedObjects.get(handIndex);
            if (grabbed) {
              const hand = handPositions[handIndex];
              if (hand) {
                // Check for delete zone (bottom left corner)
                const isInDeleteZone = handX < 20 && handY > 80;
                setShowDeleteZone(true);
                setIsOverDeleteZone(isInDeleteZone);
                
                // Check hold time for hold-to-delete (2.5 seconds)
                const holdStart = holdStartTimeRef.current.get(grabbed.id);
                const holdStartPos = holdStartPositionRef.current.get(grabbed.id);
                if (holdStart && holdStartPos) {
                  // Check if card has moved significantly
                  const distance = Math.sqrt(
                    Math.pow(handX - holdStartPos.x, 2) + 
                    Math.pow(handY - holdStartPos.y, 2)
                  );
                  
                  if (distance > 2) {
                    // Card moved, reset hold timer
                    holdStartTimeRef.current.set(grabbed.id, Date.now());
                    holdStartPositionRef.current.set(grabbed.id, { x: handX, y: handY });
                    setShowHoldDeleteButton(null);
                  } else if (Date.now() - holdStart > 1500 && showHoldDeleteButton !== grabbed.id) {
                    // Held for 1.5 seconds in same position
                    setShowHoldDeleteButton(grabbed.id);
                  }
                } else {
                  // Don't reset if already showing delete button
                  if (!showHoldDeleteButton) {
                    setShowHoldDeleteButton(null);
                  }
                }
                
                objectUpdates.set(grabbed.id, { 
                  ...(objectUpdates.get(grabbed.id) || {}), 
                  position: { 
                    x: handX - grabbed.offsetX - canvasOffset.x, 
                    y: handY - grabbed.offsetY - canvasOffset.y 
                  } 
                });
              }
            } else {
              setShowDeleteZone(false);
              setIsOverDeleteZone(false);
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
            
            // Don't reset hold state when releasing - keep the shake and delete button visible
            
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
      <ThemeToggle />
      <GesturesInfo />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" style={{ opacity: canvasBackground ? 0.3 : 1 }} />
      <div className="relative z-10">
        {!isTracking ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="text-center space-y-6 max-w-2xl">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Spatial UI Controller</h1>
              <p className="text-xl text-muted-foreground">Control your interface with natural hand gestures</p>
              
              {trackingMode === 'initial' && (
                <div className="space-y-4 pt-8">
                  <p className="text-lg text-muted-foreground mb-6">Choose your tracking method:</p>
                  <div className="flex flex-col gap-4">
                    <Button 
                      onClick={handleStartTracking} 
                      disabled={!isReady} 
                      size="lg" 
                      className="text-lg px-8 py-6 neon-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isReady ? '🖥️ Start Local Camera Tracking' : 'Loading Model...'}
                    </Button>
                    <Button 
                      onClick={() => setTrackingMode('mobile-qr')} 
                      disabled={!isReady} 
                      size="lg" 
                      variant="secondary"
                      className="text-lg px-8 py-6"
                    >
                      📱 Start Mobile Camera Tracking
                    </Button>
                  </div>
                </div>
              )}
              
              {trackingMode === 'mobile-qr' && (
                <div className="space-y-6 pt-8">
                  <QRCodeConnection 
                    onSessionId={setSessionId}
                  />
                  
                  {/* Connection Status Indicator */}
                  <div className="flex flex-col items-center gap-3">
                    {!isRemoteConnected && sessionId && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Waiting for mobile device...</span>
                      </div>
                    )}
                    {isRemoteConnected && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <span className="text-lg">✓</span>
                        <span className="text-sm">Mobile connected - hand tracking active</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => setTrackingMode('initial')} 
                      variant="outline"
                      size="lg"
                      className="text-lg px-6 py-4"
                    >
                      ← Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative min-h-screen">
            <video ref={videoRef} autoPlay playsInline muted className="fixed -left-[9999px] opacity-0 pointer-events-none" />
            
            {/* Debug panel - removed */}
            
            {/* Full-screen 3D Scene for OBJ models */}
            <Scene3D
              objects={objects.filter(obj => obj.type === 'obj').map(obj => ({
                id: obj.id,
                objUrl: obj.fileUrl || '',
                position: { x: obj.position.x, y: obj.position.y, z: obj.position.z || 0 },
                rotation: obj.rotation,
                scale: obj.scale || 1,
              }))}
              grabbedObjects={grabbedObjects}
              handPositions={handPositions}
              gestureStates={gestureStates}
              landmarks={landmarks}
              onUpdateObject={handleUpdate3DObject}
              showPlane={false}
            />
            
            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.gltf,.glb,.obj,.fbx" onChange={handleFileImport} className="hidden" />
            <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
            <input ref={objInputRef} type="file" accept=".obj" onChange={handleOBJFileSelect} className="hidden" />
            
            {/* Settings button - bottom right */}
            <div className="fixed bottom-8 right-8 z-50 pointer-events-auto">
              <Button 
                onClick={() => setShowSettingsPanel(!showSettingsPanel)} 
                size="lg" 
                className="rounded-full neon-glow transition-all duration-200 w-16 h-16 p-0"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Add card button - top center */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
              <Button 
                onClick={() => {
                  maxZIndexRef.current += 1;
                  const randomPos = getRandomPosition();
                  const newCard: ObjectData = {
                    id: Date.now().toString(),
                    type: 'card',
                    title: getRandomWord(),
                    description: 'New spatial card',
                    position: randomPos,
                    zIndex: maxZIndexRef.current,
                    rotation: { x: 0, y: 0, z: 0 },
                    velocity: { x: 0, y: 0 },
                    isPhysicsEnabled: false,
                    scale: 0.5,
                  };
                  setObjects(prev => [...prev, newCard]);
                  setTimeout(() => {
                    setObjects(prev => prev.map(obj => 
                      obj.id === newCard.id ? { ...obj, scale: 1 } : obj
                    ));
                  }, 10);
                }}
                size="lg" 
                className={`rounded-full neon-glow transition-all duration-200 w-20 h-20 p-0 ${
                  isPlusButtonClicked 
                    ? 'scale-90' 
                    : isPlusButtonHovered 
                    ? 'scale-110' 
                    : 'scale-100'
                }`}
                title="Add Card (or pinch with hand)"
              >
                <Plus className="w-10 h-10" />
              </Button>
            </div>

            {/* Settings Panel */}
            {showSettingsPanel && (
              <div className="fixed top-8 right-8 z-50 pointer-events-auto animate-scale-in">
            <SettingsPanel
              showConnectors={showConnectors}
              setShowConnectors={setShowConnectors}
              show3DHand={show3DHand}
              setShow3DHand={setShow3DHand}
              showSkeleton={showSkeleton}
              setShowSkeleton={setShowSkeleton}
              showPlane={showPlane}
              setShowPlane={setShowPlane}
              onRestart={handleRestart}
              onImportFile={() => fileInputRef.current?.click()}
              onBackgroundUpload={() => backgroundInputRef.current?.click()}
              onImportOBJ={() => objInputRef.current?.click()}
              onClose={() => setShowSettingsPanel(false)}
              onShowAdvancedSettings={() => setShowSettings(!showSettings)}
              alignmentParams={alignmentParams}
            />
              </div>
            )}
            <div className="absolute inset-0 origin-center transition-transform duration-200" style={{ transform: `scale(${canvasZoom})`, willChange: 'transform' }}>
              {objects.sort((a, b) => a.zIndex - b.zIndex).map((obj) => {
                const isBeingDragged = Array.from(grabbedObjects.values()).some(g => g.id === obj.id);
                const handIndex = Array.from(grabbedObjects.entries()).find(([_, g]) => g.id === obj.id)?.[0];
                const isMerging = mergingCards.has(obj.id);
                const isSplitting = splittingCards.has(obj.id);
                
                // Apply alignment offset to hand position for accurate interaction
                let adjustedHandPosition = handIndex !== undefined ? handPositions[handIndex] : null;
                const currentLandmarks = (remoteLandmarks && remoteLandmarks.length > 0) ? remoteLandmarks : landmarks;
                
                if (adjustedHandPosition && currentLandmarks && currentLandmarks[handIndex]) {
                  const hand = currentLandmarks[handIndex];
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
                  scale={obj.scale || 1} 
                  isMerging={isMerging}
                  isSplitting={isSplitting} 
                  allHandPositions={handPositions} 
                  allGestureStates={gestureStates}
                  onConnectorGrab={handleConnectorGrab}
                  activeConnector={activeWire ? `${activeWire.startCardId}-${activeWire.startConnector}` : null}
                  hoveredConnector={hoveredConnector}
                  onConnectorHover={setHoveredConnector}
                  showConnectors={showConnectors}
                  isShaking={showHoldDeleteButton === obj.id}
                />;
              })}
              
              {/* Hold-to-delete button */}
              {showHoldDeleteButton && objects.find(obj => obj.id === showHoldDeleteButton) && (
                <CardHoldDeleteButton
                  position={{
                    x: ((objects.find(obj => obj.id === showHoldDeleteButton)!.position.x + canvasOffset.x) * window.innerWidth) / 100,
                    y: ((objects.find(obj => obj.id === showHoldDeleteButton)!.position.y + canvasOffset.y) * window.innerHeight) / 100,
                  }}
                  onDelete={() => {
                    setObjects(prev => prev.filter(o => o.id !== showHoldDeleteButton));
                    setShowHoldDeleteButton(null);
                    holdStartTimeRef.current.delete(showHoldDeleteButton);
                    holdStartPositionRef.current.delete(showHoldDeleteButton);
                    toast({ title: "Card deleted", description: "Card moved to trash" });
                  }}
                  handPosition={
                    handPositions[0]
                      ? {
                          x: handPositions[0].x * window.innerWidth,
                          y: handPositions[0].y * window.innerHeight,
                        }
                      : null
                  }
                  isPinching={gestureStates[0]?.isPinching || false}
                />
              )}
              
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
                {/* Live tracked hands - use remote landmarks if available, otherwise local */}
                {((remoteLandmarks && remoteLandmarks.length > 0) || (landmarks && landmarks.length > 0)) && (
                  <Hand3DModel 
                    landmarks={remoteLandmarks && remoteLandmarks.length > 0 ? remoteLandmarks : landmarks} 
                    videoWidth={window.innerWidth} 
                    videoHeight={window.innerHeight} 
                    alignmentParams={alignmentParams} 
                    handedness={remoteLandmarks && remoteLandmarks.length > 0 ? remoteHandedness : handedness} 
                  />
                )}
              </>
            )}
            {showSkeleton && ((remoteLandmarks && remoteLandmarks.length > 0) || (landmarks && landmarks.length > 0)) && (
              <HandSkeleton 
                landmarks={remoteLandmarks && remoteLandmarks.length > 0 ? remoteLandmarks : landmarks} 
                videoWidth={window.innerWidth} 
                videoHeight={window.innerHeight} 
                alignmentParams={alignmentParams} 
                handedness={remoteLandmarks && remoteLandmarks.length > 0 ? remoteHandedness : handedness} 
              />
            )}
            
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
              <div className={`fixed top-8 z-50 transition-all duration-300 ${showSettingsPanel ? 'right-[26rem]' : 'right-8'}`}>
                <AlignmentSettings params={alignmentParams} onParamsChange={setAlignmentParams} />
              </div>
            )}


            {/* Object Manipulation Indicators for 3D objects */}
            {objects.filter(obj => obj.type === 'obj').map((obj) => {
              const grabbed = Array.from(grabbedObjects.entries()).find(([_, g]) => g.id === obj.id);
              if (!grabbed) return null;

              const [handIndex] = grabbed;
              const handPos = handPositions[handIndex];
              if (!handPos) return null;

              return (
                <ObjectManipulationIndicator
                  key={`indicator-${obj.id}`}
                  rotation={obj.rotation.y}
                  scale={obj.scale || 1}
                  position={{ 
                    x: handPos.x * 100, 
                    y: handPos.y * 100 
                  }}
                  isVisible={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
