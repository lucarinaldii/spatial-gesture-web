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

// Create a finger segment (bone) between two landmarks
function FingerSegment({ start, end, radius = 0.2, color = "#8b5cf6" }: { 
  start: THREE.Vector3; 
  end: THREE.Vector3; 
  radius?: number;
  color?: string;
}) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  
  // Calculate rotation to align cylinder with bone direction
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, distance, 12]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.4}
        metalness={0.3}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Create a joint (sphere) at a landmark
function Joint({ position, radius = 0.25, color = "#9333ea" }: {
  position: THREE.Vector3;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.4}
        metalness={0.3}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Animated hand with finger tracking
function AnimatedHandModel({ landmarks, handIndex }: HandModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Convert all landmarks to 3D vectors
  const vectors = landmarks.map(lm => landmarkToVector3(lm, 10));
  
  // Define finger chains with their landmark indices
  const fingers = [
    { name: 'thumb', indices: [1, 2, 3, 4], color: '#a855f7' },
    { name: 'index', indices: [5, 6, 7, 8], color: '#8b5cf6' },
    { name: 'middle', indices: [9, 10, 11, 12], color: '#7c3aed' },
    { name: 'ring', indices: [13, 14, 15, 16], color: '#6d28d9' },
    { name: 'pinky', indices: [17, 18, 19, 20], color: '#5b21b6' },
  ];
  
  // Palm connections
  const palmConnections = [
    [0, 5], [0, 17], [5, 9], [9, 13], [13, 17]
  ];
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Offset for second hand
    if (handIndex === 1) {
      groupRef.current.position.x = 5;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Render palm connections */}
      {palmConnections.map(([startIdx, endIdx], index) => (
        <FingerSegment
          key={`palm-${index}`}
          start={vectors[startIdx]}
          end={vectors[endIdx]}
          radius={0.25}
          color="#7c3aed"
        />
      ))}
      
      {/* Render each finger */}
      {fingers.map((finger) => (
        <group key={finger.name}>
          {/* Connection from wrist to finger base */}
          <FingerSegment
            start={vectors[0]}
            end={vectors[finger.indices[0]]}
            radius={0.22}
            color={finger.color}
          />
          
          {/* Finger segments */}
          {finger.indices.map((landmarkIdx, segmentIdx) => {
            if (segmentIdx === finger.indices.length - 1) return null;
            const nextIdx = finger.indices[segmentIdx + 1];
            const isTip = segmentIdx === finger.indices.length - 2;
            
            return (
              <group key={`${finger.name}-segment-${segmentIdx}`}>
                <FingerSegment
                  start={vectors[landmarkIdx]}
                  end={vectors[nextIdx]}
                  radius={isTip ? 0.18 : 0.2}
                  color={finger.color}
                />
                <Joint 
                  position={vectors[landmarkIdx]} 
                  radius={isTip ? 0.22 : 0.25}
                  color={finger.color}
                />
              </group>
            );
          })}
          
          {/* Fingertip joint */}
          <Joint 
            position={vectors[finger.indices[finger.indices.length - 1]]} 
            radius={0.3}
            color="#a855f7"
          />
        </group>
      ))}
      
      {/* Wrist joint */}
      <Joint position={vectors[0]} radius={0.35} color="#8b5cf6" />
      
      {/* Palm base joints */}
      {[5, 9, 13, 17].map(idx => (
        <Joint key={`palm-joint-${idx}`} position={vectors[idx]} radius={0.28} color="#7c3aed" />
      ))}
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
      >
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
        
        {/* Lighting for depth */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 8]} intensity={1.2} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.6} />
        <pointLight position={[0, 0, 15]} intensity={0.8} color="#a855f7" />
        <pointLight position={[5, 5, 10]} intensity={0.5} color="#8b5cf6" />
        <spotLight position={[0, 10, 10]} intensity={0.5} angle={0.5} penumbra={0.5} color="#9333ea" />
        
        {/* Render each detected hand */}
        {landmarks.map((handLandmarks, index) => (
          <AnimatedHandModel 
            key={`hand-${index}`}
            landmarks={handLandmarks}
            handIndex={index}
          />
        ))}
      </Canvas>
    </div>
  );
}
