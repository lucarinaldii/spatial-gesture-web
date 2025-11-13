import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { calculateHandPose, smoothPose } from '@/utils/handBoneCalculations';

interface Hand3DModelProps {
  landmarks: NormalizedLandmark[][];
  videoWidth: number;
  videoHeight: number;
}

interface HandModelProps {
  landmarks: NormalizedLandmark[];
  handIndex: number;
}

// Procedural hand visualization using spheres and cylinders
function ProceduralHandModel({ landmarks, handIndex }: HandModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const previousPoseRef = useRef<{ position: THREE.Vector3; rotation: THREE.Quaternion } | null>(null);
  
  useFrame(() => {
    if (!groupRef.current || !landmarks || landmarks.length === 0) return;
    
    // Calculate hand pose from landmarks
    const pose = calculateHandPose(landmarks, 10);
    
    // Apply smoothing
    const targetPose = { position: pose.position, rotation: pose.rotation };
    let finalPose = targetPose;
    if (previousPoseRef.current) {
      finalPose = smoothPose(previousPoseRef.current, targetPose, 0.4);
    }
    previousPoseRef.current = finalPose;
    
    // Apply position and rotation to the group
    groupRef.current.position.copy(finalPose.position);
    groupRef.current.quaternion.copy(finalPose.rotation);
    
    // Offset for multiple hands
    if (handIndex === 1) {
      groupRef.current.position.x += 5;
    }
  });
  
  // Create spheres at each landmark position
  const landmarkSpheres = landmarks.map((landmark, index) => {
    const isTip = [4, 8, 12, 16, 20].includes(index);
    const isWrist = index === 0;
    const size = isTip ? 0.4 : isWrist ? 0.5 : 0.3;
    
    return (
      <mesh
        key={`landmark-${index}`}
        position={[
          (1 - landmark.x) * 10 - 5,
          -landmark.y * 10 + 5,
          -landmark.z * 20
        ]}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial 
          color={isTip ? "#a855f7" : isWrist ? "#8b5cf6" : "#9333ea"} 
          opacity={0.8} 
          transparent 
          emissive={isTip ? "#a855f7" : "#8b5cf6"}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  });
  
  // Create cylinders for bones (connections between landmarks)
  const bones = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm
    [5, 9], [9, 13], [13, 17]
  ];
  
  const boneConnections = bones.map(([startIdx, endIdx], index) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    
    const startPos = new THREE.Vector3(
      (1 - start.x) * 10 - 5,
      -start.y * 10 + 5,
      -start.z * 20
    );
    const endPos = new THREE.Vector3(
      (1 - end.x) * 10 - 5,
      -end.y * 10 + 5,
      -end.z * 20
    );
    
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const distance = startPos.distanceTo(endPos);
    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    
    // Calculate rotation to align cylinder with bone
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    return (
      <mesh
        key={`bone-${index}`}
        position={midpoint}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[0.15, 0.15, distance, 8]} />
        <meshStandardMaterial 
          color="#7c3aed" 
          opacity={0.6} 
          transparent 
          emissive="#7c3aed"
          emissiveIntensity={0.2}
        />
      </mesh>
    );
  });
  
  return (
    <group ref={groupRef}>
      {landmarkSpheres}
      {boneConnections}
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
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 0, 15]} intensity={0.6} color="#a855f7" />
        <pointLight position={[0, 0, -5]} intensity={0.3} color="#8b5cf6" />
        
        {/* Render each detected hand */}
        {landmarks.map((handLandmarks, index) => (
          <ProceduralHandModel 
            key={`hand-${index}`}
            landmarks={handLandmarks}
            handIndex={index}
          />
        ))}
      </Canvas>
    </div>
  );
}
