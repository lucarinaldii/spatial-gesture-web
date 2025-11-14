import { useRef, memo } from 'react';
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

// Create a smooth finger segment using capsule-like geometry - flatter and more human
function SmoothFingerSegment({ start, end, startRadius = 0.16, endRadius = 0.13 }: {
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
      <mesh position={midpoint} quaternion={quaternion}>
        <cylinderGeometry args={[endRadius, startRadius, distance, 16, 1, false]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#f8f8f8"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Smooth caps at both ends */}
      <mesh position={start}>
        <sphereGeometry args={[startRadius, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#f8f8f8"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[endRadius, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#f8f8f8"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
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
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color="#ffffff"
        emissive="#f8f8f8"
        emissiveIntensity={0.15}
        roughness={0.3}
        metalness={0.05}
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
    // Apply 30% scale increase: 0.65 * 1.3 = 0.845
    const scaleFactor = 0.845;
    // Match skeleton positioning - use actual x position (mirrored) without center offset
    const x = (1 - lm.x - 0.5) * 15 * scaleFactor;  // Flip horizontally and scale from center
    const y = -(lm.y - 0.5) * 15 * scaleFactor;     // Flip vertically and scale from center
    const z = -lm.z * 10;                            // Depth (negative to push away from camera)
    return new THREE.Vector3(x, y, z);
  });
  
  const fingers = [
    { 
      name: 'thumb', 
      indices: [1, 2, 3, 4],
      radii: [[0.21, 0.18], [0.18, 0.17], [0.17, 0.16]]
    },
    { 
      name: 'index', 
      indices: [5, 6, 7, 8],
      radii: [[0.18, 0.17], [0.17, 0.16], [0.16, 0.13]]
    },
    { 
      name: 'middle', 
      indices: [9, 10, 11, 12],
      radii: [[0.20, 0.18], [0.18, 0.16], [0.16, 0.14]]
    },
    { 
      name: 'ring', 
      indices: [13, 14, 15, 16],
      radii: [[0.18, 0.16], [0.16, 0.14], [0.14, 0.13]]
    },
    { 
      name: 'pinky', 
      indices: [17, 18, 19, 20],
      radii: [[0.16, 0.14], [0.14, 0.13], [0.13, 0.12]]
    },
  ];
  
  // Remove hardcoded positioning - hands now position based on actual landmark coordinates
  
  // Trigger re-render when landmarks change
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.updateMatrixWorld();
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Palm surface */}
      <PalmMesh vectors={vectors} />
      
      {/* Connection from wrist to finger bases */}
      <SmoothFingerSegment start={vectors[0]} end={vectors[1]} startRadius={0.26} endRadius={0.21} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[5]} startRadius={0.23} endRadius={0.20} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[9]} startRadius={0.23} endRadius={0.20} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[13]} startRadius={0.22} endRadius={0.18} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[17]} startRadius={0.21} endRadius={0.17} />
      
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
          <mesh position={vectors[finger.indices[finger.indices.length - 1]]}>
            <sphereGeometry args={[finger.radii[finger.radii.length - 1][1], 12, 12]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#f8f8f8"
              emissiveIntensity={0.15}
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
        </group>
      ))}
      
      {/* Wrist base */}
      <mesh position={vectors[0]}>
        <sphereGeometry args={[0.27, 12, 12]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#f8f8f8"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

const Hand3DModel = memo(function Hand3DModel({ landmarks, videoWidth, videoHeight }: Hand3DModelProps) {
  if (!landmarks || landmarks.length === 0) return null;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none z-20"
      style={{ 
        width: '100vw', 
        height: '100vh',
        border: '2px solid red',
        borderRadius: '8px',
      }}
    >
      <Canvas
        style={{ 
          width: '100%', 
          height: '100%',
        }}
        gl={{ 
          alpha: true, 
          antialias: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        }}
        frameloop="always"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={75} />
        
        {/* Simplified lighting without shadows for performance */}
        <ambientLight intensity={0.9} />
        <directionalLight 
          position={[5, 10, 8]} 
          intensity={0.8} 
          color="#fff5e6" 
        />
        <directionalLight position={[-5, -5, -8]} intensity={0.3} color="#ffeedd" />
        <pointLight position={[0, 5, 15]} intensity={0.4} color="#ffe4d1" />
        
        {/* Subtle ground plane without shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.1} />
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
});

export default Hand3DModel;
