import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandSkeleton from '@/components/HandSkeleton';
import InteractiveObject from '@/components/InteractiveObject';
import { useToast } from '@/hooks/use-toast';
import { Plus, RotateCcw } from 'lucide-react';

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

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { isReady, handPositions, gestureStates, landmarks, videoRef, startCamera } = useHandTracking();
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
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const [grabbedObjects, setGrabbedObjects] = useState<Map<number, { id: string; offsetX: number; offsetY: number; }>>(new Map());
  const [objectScales, setObjectScales] = useState<Map<string, number>>(new Map());
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

  const handleStartTracking = async () => {
    setIsTracking(true);
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
    
    toast({ title: "File imported", description: `${file.name} added to scene` });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestart = useCallback(() => {
    // Clear all refs and state
    setGrabbedObjects(new Map());
    baseDistanceRef.current.clear();
    baseAngleRef.current.clear();
    handVelocityHistoryRef.current.clear();
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
    setObjectScales(new Map());
    setGrabbedObjects(new Map());
    maxZIndexRef.current = 3;
    baseDistanceRef.current.clear();
    baseAngleRef.current.clear();
    
    toast({ title: "Session restarted", description: "Canvas and objects reset" });
  }, [toast]);

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
      lastPinchStates.current.clear();
      return;
    }

    const updateDrag = () => {
      const newGrabbedObjects = new Map(grabbedObjects);
      let hasChanges = false;
      const objectUpdates = new Map<string, { position?: { x: number; y: number }, zIndex?: number, rotation?: { x: number; y: number; z: number } }>();
      let scaleUpdate: { id: string; scale: number } | null = null;

      handPositions.forEach((handPos, handIndex) => {
        const gesture = gestureStates[handIndex];
        if (!gesture) return;
        const isPinching = gesture.isPinching;
        const handX = handPos.x * 100;
        const handY = handPos.y * 100;
        const wasPinching = lastPinchStates.current.get(handIndex) || false;

        // Track hand velocity history for inertia calculation
        const now = Date.now();
        if (!handVelocityHistoryRef.current.has(handIndex)) {
          handVelocityHistoryRef.current.set(handIndex, []);
        }
        const history = handVelocityHistoryRef.current.get(handIndex)!;
        history.push({ x: handX, y: handY, timestamp: now });
        // Keep only last 5 frames (about 83ms at 60fps)
        if (history.length > 5) history.shift();

        if (isPinching && !wasPinching) {
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

        if (isPinching) {
          const obj0 = newGrabbedObjects.get(0);
          const obj1 = newGrabbedObjects.get(1);
          
          if (newGrabbedObjects.size === 0) {
            if (handPositions.length === 2) {
              const hand1X = handPositions[0].x * 100, hand1Y = handPositions[0].y * 100;
              const hand2X = handPositions[1].x * 100, hand2Y = handPositions[1].y * 100;
              const distance = Math.sqrt(Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2));
              if (!canvasZoomBaseDistanceRef.current) canvasZoomBaseDistanceRef.current = distance;
              else setCanvasZoom(Math.max(0.5, Math.min(3, distance / canvasZoomBaseDistanceRef.current)));
              const midX = (hand1X + hand2X) / 2, midY = (hand1Y + hand2Y) / 2;
              if (!canvasDragStartRef.current) canvasDragStartRef.current = { x: midX, y: midY };
              else {
                setCanvasOffset(prev => ({ x: prev.x + midX - canvasDragStartRef.current!.x, y: prev.y + midY - canvasDragStartRef.current!.y }));
                canvasDragStartRef.current = { x: midX, y: midY };
              }
            } else if (canvasDragStartRef.current) {
              setCanvasOffset(prev => ({ x: prev.x + handX - canvasDragStartRef.current!.x, y: prev.y + handY - canvasDragStartRef.current!.y }));
              canvasDragStartRef.current = { x: handX, y: handY };
            }
          } else if (obj0 && obj1 && obj0.id === obj1.id && handPositions.length === 2) {
            const hand1X = handPositions[0].x * 100, hand1Y = handPositions[0].y * 100;
            const hand2X = handPositions[1].x * 100, hand2Y = handPositions[1].y * 100;
            const distance = Math.sqrt(Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2));
            if (!baseDistanceRef.current.has(obj0.id)) baseDistanceRef.current.set(obj0.id, distance);
            else {
              scaleUpdate = { id: obj0.id, scale: Math.max(0.5, Math.min(2, distance / baseDistanceRef.current.get(obj0.id)!)) };
              const angle = Math.atan2(hand2Y - hand1Y, hand2X - hand1X) * (180 / Math.PI);
              if (!baseAngleRef.current.has(obj0.id)) baseAngleRef.current.set(obj0.id, angle);
              else objectUpdates.set(obj0.id, { ...(objectUpdates.get(obj0.id) || {}), rotation: { x: 0, y: angle - baseAngleRef.current.get(obj0.id)!, z: 0 } });
              const avgHandX = (hand1X + hand2X) / 2, avgHandY = (hand1Y + hand2Y) / 2;
              const avgOffsetX = (obj0.offsetX + obj1.offsetX) / 2, avgOffsetY = (obj0.offsetY + obj1.offsetY) / 2;
              objectUpdates.set(obj0.id, { ...(objectUpdates.get(obj0.id) || {}), position: { x: Math.max(5, Math.min(95, avgHandX - avgOffsetX)) - canvasOffset.x, y: Math.max(5, Math.min(90, avgHandY - avgOffsetY)) - canvasOffset.y } });
            }
          } else {
            const grabbed = newGrabbedObjects.get(handIndex);
            if (grabbed) objectUpdates.set(grabbed.id, { ...(objectUpdates.get(grabbed.id) || {}), position: { x: Math.max(5, Math.min(95, handX - grabbed.offsetX)) - canvasOffset.x, y: Math.max(5, Math.min(90, handY - grabbed.offsetY)) - canvasOffset.y } });
          }
        }

        if (!isPinching && wasPinching) {
          const grabbed = newGrabbedObjects.get(handIndex);
          if (grabbed) {
            newGrabbedObjects.delete(handIndex);
            hasChanges = true;
            if (!Array.from(newGrabbedObjects.values()).some(g => g.id === grabbed.id)) {
              baseDistanceRef.current.delete(grabbed.id);
              baseAngleRef.current.delete(grabbed.id);
              
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
          if (newGrabbedObjects.size === 0) {
            canvasDragStartRef.current = null;
            canvasZoomBaseDistanceRef.current = null;
          }
        }
        lastPinchStates.current.set(handIndex, isPinching);
      });

      if (hasChanges) setGrabbedObjects(newGrabbedObjects);
      if (scaleUpdate) setObjectScales(prev => { const n = new Map(prev); n.set(scaleUpdate.id, scaleUpdate.scale); return n; });
      if (objectUpdates.size > 0) setObjects(prev => prev.map(obj => { 
        const u = objectUpdates.get(obj.id); 
        if (!u) return obj;
        return { 
          ...obj, 
          ...u, 
          position: u.position || obj.position, 
          rotation: u.rotation || obj.rotation,
          velocity: obj.velocity || { x: 0, y: 0 }
        };
      }));
    };

    animationFrameRef.current = requestAnimationFrame(updateDrag);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [handPositions, gestureStates, grabbedObjects, objects, toast]);

  useEffect(() => {
    const physicsLoop = () => {
      setObjects(prev => prev.map(obj => {
        if (!obj.isPhysicsEnabled) return obj;
        
        // Safety check: ensure position and velocity exist
        if (!obj.position || !obj.velocity) {
          return {
            ...obj,
            position: obj.position || { x: 50, y: 50 },
            velocity: obj.velocity || { x: 0, y: 0 },
            isPhysicsEnabled: false
          };
        }
        
        // Space-like floating with momentum and gentle drift
        const DRIFT_DAMPING = 0.985; // Less damping for more inertia
        const GENTLE_DRIFT = 0.03; // Very small random drift
        
        // Add tiny random drift for floating effect
        const driftX = (Math.random() - 0.5) * GENTLE_DRIFT;
        const driftY = (Math.random() - 0.5) * GENTLE_DRIFT;
        
        const newVelocity = { 
          x: obj.velocity.x * DRIFT_DAMPING + driftX, 
          y: obj.velocity.y * DRIFT_DAMPING + driftY
        };
        
        let newPosition = { 
          x: obj.position.x + newVelocity.x, 
          y: obj.position.y + newVelocity.y 
        };
        
        // Soft boundary bounce
        if (newPosition.x <= 5 || newPosition.x >= 95) { 
          newPosition.x = Math.max(5, Math.min(95, newPosition.x)); 
          newVelocity.x = -newVelocity.x * 0.5;
        }
        
        if (newPosition.y <= 5 || newPosition.y >= 85) { 
          newPosition.y = Math.max(5, Math.min(85, newPosition.y)); 
          newVelocity.y = -newVelocity.y * 0.5;
        }
        
        // Stop physics when velocity is very low (settled)
        const isSettled = Math.abs(newVelocity.y) < 0.01 && Math.abs(newVelocity.x) < 0.01;
        
        return { 
          ...obj, 
          position: newPosition, 
          velocity: newVelocity, 
          isPhysicsEnabled: !isSettled 
        };
      }));
    };
    const intervalId = setInterval(physicsLoop, 1000 / 60);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" />
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
                    <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent" /><span><strong className="text-accent">Hover:</strong> Point at cards to see interactions</span></li>
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
            
            {/* Bottom center buttons */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-6">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.gltf,.glb,.obj,.fbx" onChange={handleFileImport} className="hidden" />
              <Button 
                ref={restartButtonRef}
                onClick={handleRestart} 
                size="lg" 
                variant="destructive"
                className={`rounded-full neon-glow transition-all duration-200 text-lg px-8 py-8 ${isRestartButtonHovered ? 'scale-110 ring-2 ring-primary' : ''}`}
              >
                <RotateCcw className="w-6 h-6 mr-2" />Restart
              </Button>
              <Button 
                ref={importButtonRef}
                onClick={() => fileInputRef.current?.click()} 
                size="lg" 
                className={`rounded-full neon-glow transition-all duration-200 text-lg px-8 py-8 ${isImportButtonHovered ? 'scale-110 ring-2 ring-primary' : ''}`}
              >
                <Plus className="w-6 h-6 mr-2" />Import File
              </Button>
            </div>
            <div className="absolute inset-0 origin-center transition-transform duration-200" style={{ transform: `scale(${canvasZoom})`, willChange: 'transform' }}>
              {objects.sort((a, b) => a.zIndex - b.zIndex).map((obj) => {
                const isBeingDragged = Array.from(grabbedObjects.values()).some(g => g.id === obj.id);
                const handIndex = Array.from(grabbedObjects.entries()).find(([_, g]) => g.id === obj.id)?.[0];
                return <InteractiveObject key={obj.id} id={obj.id} type={obj.type} title={obj.title} description={obj.description} fileUrl={obj.fileUrl} position={{ x: obj.position.x + canvasOffset.x, y: obj.position.y + canvasOffset.y }} rotation={obj.rotation} zIndex={obj.zIndex} handPosition={handIndex !== undefined ? handPositions[handIndex] : null} gestureState={handIndex !== undefined ? gestureStates[handIndex] : { isPinching: false, isPointing: false, pinchStrength: 0, handIndex: 0, fingers: { thumb: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, index: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, middle: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, ring: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }, pinky: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } } } }} onInteract={() => {}} isBeingDragged={isBeingDragged} scale={objectScales.get(obj.id) || 1} />;
              })}
            </div>
            {videoRef.current && <HandSkeleton landmarks={landmarks} videoWidth={videoRef.current.videoWidth || 640} videoHeight={videoRef.current.videoHeight || 480} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
