import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
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

// OBJ Hand Model Component
function OBJHandModel({ landmarks, handIndex }: HandModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const previousPoseRef = useRef<{ position: THREE.Vector3; rotation: THREE.Quaternion } | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Load the OBJ model
  const obj = useLoader(OBJLoader, '/models/hand.obj');
  
  useEffect(() => {
    if (obj) {
      setModelLoaded(true);
      // Apply material to all meshes in the loaded object
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#8b5cf6',
            roughness: 0.5,
            metalness: 0.2,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          });
        }
      });
    }
  }, [obj]);
  
  useFrame(() => {
    if (!groupRef.current || !landmarks || landmarks.length === 0 || !modelLoaded) return;
    
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
    
    // Scale the hand model to fit the scene
    groupRef.current.scale.set(0.5, 0.5, 0.5);
    
    // Offset for multiple hands
    if (handIndex === 1) {
      groupRef.current.position.x += 5;
    }
  });
  
  if (!obj) return null;
  
  return (
    <group ref={groupRef}>
      <primitive object={obj.clone()} />
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
          <OBJHandModel 
            key={`hand-${index}`}
            landmarks={handLandmarks}
            handIndex={index}
          />
        ))}
      </Canvas>
    </div>
  );
}
