import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { landmarkToVector3, HAND_LANDMARKS } from '@/utils/handBoneCalculations';

interface Hand3DModelProps {
  landmarks: NormalizedLandmark[][];
  videoWidth: number;
  videoHeight: number;
}

interface HandModelProps {
  landmarks: NormalizedLandmark[];
  handIndex: number;
}

// Create a smooth finger segment using capsule-like geometry
function SmoothFingerSegment({ start, end, startRadius = 0.20, endRadius = 0.18 }: {
  start: THREE.Vector3; 
  end: THREE.Vector3; 
  startRadius?: number;
  endRadius?: number;
}) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  return (
    <group>
      {/* Main finger segment - tapered cylinder */}
      <mesh position={midpoint} quaternion={quaternion} castShadow>
        <cylinderGeometry args={[endRadius, startRadius, distance, 16, 1, false]} />
        <meshStandardMaterial 
          color="#ffd4b8"
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Smooth caps at both ends */}
      <mesh position={start} castShadow>
        <sphereGeometry args={[startRadius, 16, 16]} />
        <meshStandardMaterial 
          color="#ffd4b8"
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={end} castShadow>
        <sphereGeometry args={[endRadius, 16, 16]} />
        <meshStandardMaterial 
          color="#ffd4b8"
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// Create palm surface connecting all finger bases
function PalmMesh({ vectors }: { vectors: THREE.Vector3[] }) {
  const geometry = new THREE.BufferGeometry();
  
  // Create palm surface vertices
  const wrist = vectors[0];
  const thumbBase = vectors[1];
  const indexBase = vectors[5];
  const middleBase = vectors[9];
  const ringBase = vectors[13];
  const pinkyBase = vectors[17];
  
  // Define palm triangles to create a smooth surface
  const vertices = new Float32Array([
    // Palm center area
    ...wrist.toArray(), ...thumbBase.toArray(), ...indexBase.toArray(),
    ...wrist.toArray(), ...indexBase.toArray(), ...middleBase.toArray(),
    ...wrist.toArray(), ...middleBase.toArray(), ...ringBase.toArray(),
    ...wrist.toArray(), ...ringBase.toArray(), ...pinkyBase.toArray(),
    
    // Finger base connections
    ...indexBase.toArray(), ...middleBase.toArray(), ...ringBase.toArray(),
    ...indexBase.toArray(), ...ringBase.toArray(), ...pinkyBase.toArray(),
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial 
        color="#ffcba4"
        roughness={0.65}
        metalness={0.05}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Smooth, realistic hand model
function SmoothHandModel({ landmarks, handIndex }: HandModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Validate all landmarks exist before processing
  if (!landmarks || landmarks.length < 21 || landmarks.some(lm => !lm || lm.x === undefined)) {
    return null;
  }
  
  // Convert landmarks to match skeleton canvas coordinates exactly
  const vectors = landmarks.map(lm => {
    // Map normalized coordinates (0-1) to screen space matching the canvas
    // Mirror horizontally to match skeleton flip
    const x = (1 - lm.x) * 10 - 5;  // Flip horizontally and center
    const y = -lm.y * 10 + 5;       // Flip vertically to match canvas coordinates
    const z = -lm.z * 10;            // Depth (negative to push away from camera)
    return new THREE.Vector3(x, y, z);
  });
  
  const fingers = [
    { 
      name: 'thumb', 
      indices: [1, 2, 3, 4],
      radii: [[0.25, 0.22], [0.22, 0.20], [0.20, 0.18]]
    },
    { 
      name: 'index', 
      indices: [5, 6, 7, 8],
      radii: [[0.22, 0.20], [0.20, 0.18], [0.18, 0.16]]
    },
    { 
      name: 'middle', 
      indices: [9, 10, 11, 12],
      radii: [[0.23, 0.21], [0.21, 0.19], [0.19, 0.17]]
    },
    { 
      name: 'ring', 
      indices: [13, 14, 15, 16],
      radii: [[0.21, 0.19], [0.19, 0.17], [0.17, 0.15]]
    },
    { 
      name: 'pinky', 
      indices: [17, 18, 19, 20],
      radii: [[0.19, 0.17], [0.17, 0.15], [0.15, 0.13]]
    },
  ];
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    if (handIndex === 1) {
      groupRef.current.position.x = 5;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Palm surface */}
      <PalmMesh vectors={vectors} />
      
      {/* Connection from wrist to finger bases (thinner palm connections) */}
      <SmoothFingerSegment start={vectors[0]} end={vectors[1]} startRadius={0.30} endRadius={0.25} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[5]} startRadius={0.28} endRadius={0.23} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[9]} startRadius={0.28} endRadius={0.23} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[13]} startRadius={0.26} endRadius={0.22} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[17]} startRadius={0.24} endRadius={0.20} />
      
      {/* Render each finger with smooth segments */}
      {fingers.map((finger) => (
        <group key={finger.name}>
          {finger.indices.map((landmarkIdx, segmentIdx) => {
            if (segmentIdx === finger.indices.length - 1) return null;
            const nextIdx = finger.indices[segmentIdx + 1];
            const [startRadius, endRadius] = finger.radii[segmentIdx];
            
            return (
              <SmoothFingerSegment
                key={`${finger.name}-segment-${segmentIdx}`}
                start={vectors[landmarkIdx]}
                end={vectors[nextIdx]}
                startRadius={startRadius}
                endRadius={endRadius}
              />
            );
          })}
          
          {/* Fingertip - extra smooth */}
          <mesh position={vectors[finger.indices[finger.indices.length - 1]]} castShadow>
            <sphereGeometry args={[finger.radii[finger.radii.length - 1][1], 20, 20]} />
            <meshStandardMaterial 
              color="#ffd4b8"
              roughness={0.7}
              metalness={0.05}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
      
      {/* Wrist base */}
      <mesh position={vectors[0]} castShadow>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshStandardMaterial 
          color="#ffcba4"
          roughness={0.65}
          metalness={0.05}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export default function Hand3DModel({ landmarks, videoWidth, videoHeight }: Hand3DModelProps) {
  if (!landmarks || landmarks.length === 0) return null;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none z-20"
      style={{ 
        width: videoWidth, 
        height: videoHeight,
      }}
    >
      <Canvas
        style={{ 
          width: '100%', 
          height: '100%',
        }}
        gl={{ 
          alpha: true, 
          antialias: true,
          preserveDrawingBuffer: true 
        }}
        shadows
      >
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={75} />
        
        {/* Soft, natural lighting for skin-like appearance with shadows */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[5, 10, 8]} 
          intensity={1.0} 
          color="#fff5e6" 
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-5, -5, -8]} intensity={0.3} color="#ffeedd" />
        <pointLight position={[0, 5, 15]} intensity={0.5} color="#ffe4d1" castShadow />
        <hemisphereLight intensity={0.4} groundColor="#d4a574" color="#ffeedd" />
        
        {/* Ground plane for depth reference with shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <shadowMaterial opacity={0.15} color="#000000" />
        </mesh>
        
        {/* Render each detected hand */}
        {landmarks.map((handLandmarks, index) => (
          <SmoothHandModel 
            key={`hand-${index}`}
            landmarks={handLandmarks}
            handIndex={index}
          />
        ))}
      </Canvas>
    </div>
  );
}
