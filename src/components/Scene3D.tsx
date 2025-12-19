import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { GestureState, HandPosition } from '@/lib/hand-tracking';

interface Object3DData {
  id: string;
  objUrl: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

interface ModelProps {
  objUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  isGrabbed: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const Model = ({ objUrl, position, rotation, scale, isGrabbed, onPointerOver, onPointerOut }: ModelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const obj = useLoader(OBJLoader, objUrl);

  useFrame(() => {
    if (meshRef.current && !isGrabbed) {
      // Gentle idle rotation when not grabbed
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <primitive object={obj.clone()} />
      {isGrabbed && (
        <mesh>
          <boxGeometry args={[3, 3, 3]} />
          <meshBasicMaterial
            color="#00ff00"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

interface Scene3DProps {
  objects: Object3DData[];
  grabbedObjects: Map<number, { id: string }>;
  handPositions: HandPosition[];
  gestureStates: GestureState[];
  landmarks: any;
  onUpdateObject: (id: string, updates: Partial<Object3DData>) => void;
  showPlane?: boolean;
}

const Scene3DContent = ({ objects, grabbedObjects, handPositions, gestureStates, landmarks, onUpdateObject, showPlane }: Omit<Scene3DProps, 'objects'> & { objects: Object3DData[]; showPlane?: boolean }) => {
  const { camera } = useThree();
  const lastPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const baseDistanceRef = useRef<Map<string, number>>(new Map());
  const baseRotationRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Fixed camera position
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Calculate hand roll angle from landmarks
  const calculateHandRoll = (handLandmarks: any): number => {
    if (!handLandmarks || handLandmarks.length < 10) return 0;
    
    // Use wrist (0) and middle finger base (9) to calculate hand roll
    const wrist = handLandmarks[0];
    const middleBase = handLandmarks[9];
    
    // Calculate angle in radians
    const dx = middleBase.x - wrist.x;
    const dy = middleBase.y - wrist.y;
    const angle = Math.atan2(dy, dx);
    
    return angle;
  };

  useFrame(() => {
    // Update object positions based on hand tracking
    objects.forEach((obj) => {
      const grabbed = Array.from(grabbedObjects.entries()).find(([_, g]) => g.id === obj.id);
      
      if (grabbed) {
        const [handIndex, grabData] = grabbed;
        const handPos = handPositions[handIndex];
        const gesture = gestureStates[handIndex];
        const handLandmarks = landmarks?.[handIndex];

        if (handPos && gesture) {
          // Convert screen coordinates to 3D world coordinates
          const x = (handPos.x - 0.5) * 20; // Scale to world space
          const y = -(handPos.y - 0.5) * 10; // Inverted Y with reduced sensitivity
          const z = obj.position.z;

          // Smooth movement
          const lastPos = lastPositionsRef.current.get(obj.id) || obj.position;
          const smoothFactor = 0.3;
          const newX = lastPos.x + (x - lastPos.x) * smoothFactor;
          const newY = lastPos.y + (y - lastPos.y) * smoothFactor;

          lastPositionsRef.current.set(obj.id, { x: newX, y: newY, z });

          onUpdateObject(obj.id, {
            position: { x: newX, y: newY, z }
          });

          // Handle Y-axis rotation with hand roll angle
          if (handLandmarks) {
            const currentRoll = calculateHandRoll(handLandmarks);
            
            const baseKey = `${obj.id}-rotation`;
            if (!baseRotationRef.current.has(baseKey)) {
              baseRotationRef.current.set(baseKey, currentRoll);
            }

            const baseRoll = baseRotationRef.current.get(baseKey)!;
            const rotationDelta = currentRoll - baseRoll;
            
            // Update Y rotation based on hand roll
            const newRotationY = obj.rotation.y + rotationDelta;
            
            onUpdateObject(obj.id, {
              rotation: { ...obj.rotation, y: newRotationY }
            });

            // Update base rotation for smooth continuous rotation
            baseRotationRef.current.set(baseKey, currentRoll);
          }

          // Handle scale with two-hand pinch distance
          const otherHands = handPositions.filter((_, idx) => idx !== handIndex);
          if (otherHands.length > 0 && gestureStates[handIndex === 0 ? 1 : 0]?.isPinching) {
            const otherPos = otherHands[0];
            const distance = Math.sqrt(
              Math.pow(handPos.x - otherPos.x, 2) + 
              Math.pow(handPos.y - otherPos.y, 2)
            );

            const baseKey = `${obj.id}-scale`;
            if (!baseDistanceRef.current.has(baseKey)) {
              baseDistanceRef.current.set(baseKey, distance);
            }

            const baseDistance = baseDistanceRef.current.get(baseKey)!;
            const scaleFactor = (distance / baseDistance - 1) * 0.3 + 1; // Reduced sensitivity
            const newScale = scaleFactor * obj.scale;
            
            onUpdateObject(obj.id, {
              scale: Math.max(0.1, Math.min(5, newScale))
            });
          } else {
            baseDistanceRef.current.delete(`${obj.id}-scale`);
          }
        }
      } else {
        // Clear base references when object is released
        baseRotationRef.current.delete(`${obj.id}-rotation`);
        baseDistanceRef.current.delete(`${obj.id}-scale`);
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <pointLight position={[0, 0, 5]} intensity={0.5} />
      
      {showPlane && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial 
            color="hsl(var(--muted))" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}
      
      {objects.map((obj) => {
        const isGrabbed = Array.from(grabbedObjects.values()).some(g => g.id === obj.id);
        
        return (
          <Model
            key={obj.id}
            objUrl={obj.objUrl}
            position={[obj.position.x, obj.position.y, obj.position.z]}
            rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
            scale={obj.scale}
            isGrabbed={isGrabbed}
          />
        );
      })}
    </>
  );
};

export const Scene3D = ({ objects, grabbedObjects, handPositions, gestureStates, landmarks, onUpdateObject, showPlane = false }: Scene3DProps) => {
  if (objects.length === 0) return null; // Don't render if no objects
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }}
      >
        <Scene3DContent
          objects={objects}
          grabbedObjects={grabbedObjects}
          handPositions={handPositions}
          gestureStates={gestureStates}
          landmarks={landmarks}
          onUpdateObject={onUpdateObject}
          showPlane={showPlane}
        />
      </Canvas>
    </div>
  );
};
