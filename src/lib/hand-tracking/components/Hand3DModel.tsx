import { useRef, memo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { AlignmentParams } from '../types';
import { interpolateAlignmentParams, HAND_LANDMARKS } from '../utils/handBoneCalculations';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface Hand3DModelProps {
  landmarks: NormalizedLandmark[][];
  videoWidth: number;
  videoHeight: number;
  alignmentParams: AlignmentParams;
  handedness?: any;
  color?: string;
  emissiveColor?: string;
  className?: string;
}

interface HandModelProps {
  landmarks: NormalizedLandmark[];
  handIndex: number;
  alignmentParams: AlignmentParams;
  handParams: AlignmentParams['leftHand'];
  themeColor: string;
  themeEmissive: string;
}

function SmoothFingerSegment({ start, end, startRadius = 0.16, endRadius = 0.13, color, emissive }: {
  start: THREE.Vector3; 
  end: THREE.Vector3; 
  startRadius?: number;
  endRadius?: number;
  color: string;
  emissive: string;
}) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  return (
    <group>
      <mesh position={midpoint} quaternion={quaternion}>
        <cylinderGeometry args={[endRadius, startRadius, distance, 16, 1, false]} />
        <meshStandardMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={start}>
        <sphereGeometry args={[startRadius, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[endRadius, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

function PalmMesh({ vectors, color, emissive }: { vectors: THREE.Vector3[]; color: string; emissive: string }) {
  const geometry = new THREE.BufferGeometry();
  
  const wrist = vectors[0];
  const thumbBase = vectors[1];
  const indexBase = vectors[5];
  const middleBase = vectors[9];
  const ringBase = vectors[13];
  const pinkyBase = vectors[17];
  
  const vertices = new Float32Array([
    ...wrist.toArray(), ...thumbBase.toArray(), ...indexBase.toArray(),
    ...wrist.toArray(), ...indexBase.toArray(), ...middleBase.toArray(),
    ...wrist.toArray(), ...middleBase.toArray(), ...ringBase.toArray(),
    ...wrist.toArray(), ...ringBase.toArray(), ...pinkyBase.toArray(),
    ...indexBase.toArray(), ...middleBase.toArray(), ...ringBase.toArray(),
    ...indexBase.toArray(), ...ringBase.toArray(), ...pinkyBase.toArray(),
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={0.15}
        roughness={0.3}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function SmoothHandModel({ landmarks, handIndex, alignmentParams, handParams, themeColor, themeEmissive }: HandModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  if (!landmarks || landmarks.length < 21 || landmarks.some(lm => !lm || lm.x === undefined)) {
    return null;
  }
  
  const vectors = landmarks.map(lm => {
    const scaleFactor = handParams.hand3DScale;
    const baseSize = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) / 100 : 10;
    const xOffset = typeof window !== 'undefined' ? (handParams.hand3DXOffset / 100) * window.innerWidth * 0.1 : 0;
    const yOffset = typeof window !== 'undefined' ? (handParams.hand3DYOffset / 100) * window.innerHeight * 0.1 : 0;
    const x = (1 - lm.x - 0.5) * baseSize * 1.5 * scaleFactor + xOffset;
    const y = -(lm.y - 0.5) * baseSize * 1.5 * scaleFactor + yOffset;
    const z = -lm.z * handParams.hand3DZDepth;
    return new THREE.Vector3(x, y, z);
  });
  
  const fingers = [
    { name: 'thumb', indices: [1, 2, 3, 4], radii: [[0.21, 0.18], [0.18, 0.17], [0.17, 0.16]] },
    { name: 'index', indices: [5, 6, 7, 8], radii: [[0.18, 0.17], [0.17, 0.16], [0.16, 0.13]] },
    { name: 'middle', indices: [9, 10, 11, 12], radii: [[0.20, 0.18], [0.18, 0.16], [0.16, 0.14]] },
    { name: 'ring', indices: [13, 14, 15, 16], radii: [[0.18, 0.16], [0.16, 0.14], [0.14, 0.13]] },
    { name: 'pinky', indices: [17, 18, 19, 20], radii: [[0.16, 0.14], [0.14, 0.13], [0.13, 0.12]] },
  ];
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.updateMatrixWorld();
    }
  });
  
  return (
    <group ref={groupRef}>
      <PalmMesh vectors={vectors} color={themeColor} emissive={themeEmissive} />
      
      <SmoothFingerSegment start={vectors[0]} end={vectors[1]} startRadius={0.26} endRadius={0.21} color={themeColor} emissive={themeEmissive} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[5]} startRadius={0.23} endRadius={0.20} color={themeColor} emissive={themeEmissive} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[9]} startRadius={0.23} endRadius={0.20} color={themeColor} emissive={themeEmissive} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[13]} startRadius={0.22} endRadius={0.18} color={themeColor} emissive={themeEmissive} />
      <SmoothFingerSegment start={vectors[0]} end={vectors[17]} startRadius={0.21} endRadius={0.17} color={themeColor} emissive={themeEmissive} />
      
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
                color={themeColor}
                emissive={themeEmissive}
              />
            );
          })}
          
          <mesh position={vectors[finger.indices[finger.indices.length - 1]]}>
            <sphereGeometry args={[finger.radii[finger.radii.length - 1][1], 12, 12]} />
            <meshStandardMaterial 
              color={themeColor}
              emissive={themeEmissive}
              emissiveIntensity={0.15}
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
        </group>
      ))}
      
      <mesh position={vectors[0]}>
        <sphereGeometry args={[0.27, 12, 12]} />
        <meshStandardMaterial 
          color={themeColor}
          emissive={themeEmissive}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

export const Hand3DModel = memo(function Hand3DModel({
  landmarks,
  videoWidth,
  videoHeight,
  alignmentParams,
  handedness,
  color,
  emissiveColor,
  className = '',
}: Hand3DModelProps) {
  const [themeColors, setThemeColors] = useState({ color: color || '#ffffff', emissive: emissiveColor || '#f8f8f8' });
  
  useEffect(() => {
    if (color && emissiveColor) {
      setThemeColors({ color, emissive: emissiveColor });
      return;
    }
    
    const updateThemeColors = () => {
      try {
        const rootStyles = getComputedStyle(document.documentElement);
        const foregroundHSL = rootStyles.getPropertyValue('--foreground').trim();
        if (foregroundHSL) {
          const [h, s, l] = foregroundHSL.split(' ').map(v => parseFloat(v.replace('%', '')));
          const computedColor = `hsl(${h}, ${s}%, ${l}%)`;
          const computedEmissive = `hsl(${h}, ${s}%, ${Math.max(l - 3, 0)}%)`;
          setThemeColors({ color: computedColor, emissive: computedEmissive });
        }
      } catch {
        // Use defaults
      }
    };
    
    updateThemeColors();
    
    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [color, emissiveColor]);
  
  if (!landmarks || landmarks.length === 0) return null;
  
  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-20 ${className}`}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          alpha: true, 
          antialias: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        }}
        frameloop="always"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={75} />
        
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 8]} intensity={0.8} color="#fff5e6" />
        <directionalLight position={[-5, -5, -8]} intensity={0.3} color="#ffeedd" />
        <pointLight position={[0, 5, 15]} intensity={0.4} color="#ffe4d1" />
        
        {landmarks.map((handLandmarks, index) => {
          const wrist = handLandmarks[0];
          const middleMCP = handLandmarks[9];
          const handCenterX = (wrist.x + middleMCP.x) / 2;
          
          const interpolated = interpolateAlignmentParams(
            alignmentParams.leftHand as unknown as { [key: string]: number },
            alignmentParams.rightHand as unknown as { [key: string]: number },
            handCenterX
          ) as unknown as AlignmentParams['leftHand'];
          
          return (
            <SmoothHandModel 
              key={`hand-${index}`}
              landmarks={handLandmarks}
              handIndex={index}
              alignmentParams={alignmentParams}
              handParams={interpolated}
              themeColor={themeColors.color}
              themeEmissive={themeColors.emissive}
            />
          );
        })}
      </Canvas>
    </div>
  );
});
