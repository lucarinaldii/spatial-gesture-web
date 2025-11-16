import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

interface ModelProps {
  objUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  isGrabbed: boolean;
}

const Model = ({ objUrl, position, rotation, scale, isGrabbed }: ModelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const obj = useLoader(OBJLoader, objUrl);

  useFrame(() => {
    if (meshRef.current && !isGrabbed) {
      // Gentle idle rotation when not grabbed
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <primitive object={obj.clone()} />
      {isGrabbed && (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
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

interface OBJ3DModelProps {
  objUrl: string;
  position: { x: number; y: number };
  rotation: { x: number; y: number; z: number };
  scale?: number;
  isGrabbed?: boolean;
  width?: number;
  height?: number;
}

export const OBJ3DModel = ({
  objUrl,
  position,
  rotation,
  scale = 1,
  isGrabbed = false,
  width = 300,
  height = 300,
}: OBJ3DModelProps) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${width}px`,
        height: `${height}px`,
        border: isGrabbed ? '2px solid #00ff00' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.8)',
      }}
    >
      {error ? (
        <div className="flex items-center justify-center h-full text-red-500 p-4 text-center">
          {error}
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          onError={() => setError('Failed to load 3D model')}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <Model
            objUrl={objUrl}
            position={[0, 0, 0]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            scale={scale}
            isGrabbed={isGrabbed}
          />
          {!isGrabbed && <OrbitControls enableZoom={true} enablePan={false} />}
        </Canvas>
      )}
    </div>
  );
};
