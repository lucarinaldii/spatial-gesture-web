import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandSkeleton from '@/components/HandSkeleton';
import InteractiveObject from '@/components/InteractiveObject';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

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
  const [grabbedObjects, setGrabbedObjects] = useState<Map<number, { id: string; offsetX: number; offsetY: number; }>>(new Map());
  const [objectScales, setObjectScales] = useState<Map<string, number>>(new Map());
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const lastPinchStates = useRef<Map<number, boolean>>(new Map());
  const animationFrameRef = useRef<number>();
  const maxZIndexRef = useRef(3);
  const baseDistanceRef = useRef<Map<string, number>>(new Map());
  const baseAngleRef = useRef<Map<string, number>>(new Map());
  const canvasDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasZoomBaseDistanceRef = useRef<number | null>(null);

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
              setObjects(prev => prev.map(obj => obj.id === grabbed.id ? { ...obj, isPhysicsEnabled: true, velocity: { x: 0, y: 0 } } : obj));
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
      if (objectUpdates.size > 0) setObjects(prev => prev.map(obj => { const u = objectUpdates.get(obj.id); return u ? { ...obj, ...u, position: u.position || obj.position, rotation: u.rotation || obj.rotation } : obj; }));
    };

    animationFrameRef.current = requestAnimationFrame(updateDrag);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [handPositions, gestureStates, grabbedObjects, objects, toast]);

  useEffect(() => {
    const physicsLoop = () => {
      setObjects(prev => prev.map(obj => {
        if (!obj.isPhysicsEnabled) return obj;
        const newVelocity = { x: obj.velocity.x * 0.98, y: obj.velocity.y + 0.5 };
        let newPosition = { x: obj.position.x + newVelocity.x, y: obj.position.y + newVelocity.y };
        if (newPosition.y >= 85) { newPosition.y = 85; newVelocity.y = -newVelocity.y * 0.6; if (Math.abs(newVelocity.y) < 0.5) newVelocity.y = 0; }
        if (newPosition.x <= 5 || newPosition.x >= 95) { newPosition.x = Math.max(5, Math.min(95, newPosition.x)); newVelocity.x = -newVelocity.x * 0.6; }
        const isSettled = Math.abs(newVelocity.y) < 0.1 && Math.abs(newVelocity.x) < 0.1 && Math.abs(newPosition.y - 85) < 1;
        return { ...obj, position: newPosition, velocity: newVelocity, isPhysicsEnabled: !isSettled };
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
            <div className="fixed top-4 right-4 z-50">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.gltf,.glb,.obj,.fbx" onChange={handleFileImport} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} size="lg" className="neon-glow"><Plus className="w-5 h-5 mr-2" />Import File</Button>
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
