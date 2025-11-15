import { useState, useRef, useEffect, memo, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { HandPosition, GestureState } from '@/hooks/useHandTracking';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { HandGestureControls } from './HandGestureControls';
import CardConnector from './CardConnector';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InteractiveObjectProps {
  id: string;
  type: 'card' | 'image' | 'pdf' | 'model3d';
  title?: string;
  description?: string;
  fileUrl?: string;
  position: { x: number; y: number };
  rotation: { x: number; y: number; z: number };
  zIndex: number;
  handPosition: HandPosition | null;
  gestureState: GestureState;
  onInteract: () => void;
  isBeingDragged?: boolean;
  scale?: number;
  isMerging?: boolean;
  isSplitting?: boolean;
  allHandPositions?: HandPosition[];
  allGestureStates?: GestureState[];
  onConnectorGrab?: (connectorId: string) => void;
  activeConnector?: string | null;
  hoveredConnector?: string | null;
  onConnectorHover?: (connectorId: string | null) => void;
}

const Model3D = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
};

const InteractiveObject = memo(({
  id,
  type,
  title,
  description,
  fileUrl,
  position,
  rotation,
  zIndex,
  handPosition,
  gestureState,
  onInteract,
  isBeingDragged = false,
  scale = 1,
  isMerging = false,
  isSplitting = false,
  allHandPositions = [],
  allGestureStates = [],
  onConnectorGrab,
  activeConnector,
  hoveredConnector,
  onConnectorHover,
}: InteractiveObjectProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const objectRef = useRef<HTMLDivElement>(null);
  const lastPinchState = useRef(false);

  useEffect(() => {
    if (!handPosition || !objectRef.current || isBeingDragged) {
      setIsHovered(false);
      return;
    }

    const rect = objectRef.current.getBoundingClientRect();
    const handX = handPosition.x * window.innerWidth;
    const handY = handPosition.y * window.innerHeight;

    const isInBounds =
      handX >= rect.left &&
      handX <= rect.right &&
      handY >= rect.top &&
      handY <= rect.bottom;

    setIsHovered(isInBounds);

    if (isInBounds && gestureState.isPinching && !lastPinchState.current) {
      onInteract();
      setWasClicked(true);
      setTimeout(() => setWasClicked(false), 300);
    }

    lastPinchState.current = gestureState.isPinching;
  }, [handPosition, gestureState, onInteract, isBeingDragged]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={fileUrl} 
              alt={title || 'Imported image'} 
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white">
            <Document 
              file={fileUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex items-center justify-center"
            >
              <Page 
                pageNumber={pageNumber} 
                width={220}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            {numPages > 1 && (
              <p className="text-xs text-gray-600 mt-2">
                Page {pageNumber} of {numPages}
              </p>
            )}
          </div>
        );
      
      case 'model3d':
        return (
          <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Suspense fallback={null}>
                <Center>
                  <Model3D url={fileUrl || ''} />
                </Center>
              </Suspense>
              <HandGestureControls 
                gestureStates={allGestureStates} 
                handPositions={allHandPositions} 
              />
            </Canvas>
          </div>
        );
      
      default: // card
        return (
          <>
            <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </>
        );
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        perspective: '1200px',
        zIndex,
      }}
    >
      <div
        ref={objectRef}
        className={`will-change-transform ${isMerging ? 'animate-scale-out' : ''} ${isSplitting ? 'animate-scale-out' : ''}`}
        style={{
          transform: `translate(-50%, -50%) scale(${scale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transformStyle: 'preserve-3d',
          transition: isBeingDragged ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isMerging || isSplitting ? 0.5 : 1,
        }}
      >
        <Card
          className={`
            glass-panel transition-all duration-200 relative
            ${type === 'card' ? 'p-6 w-64' : 'p-2 w-80 h-80'}
            ${isHovered ? 'border-primary' : 'border-border/30'}
            ${wasClicked ? 'scale-95' : ''}
            ${isBeingDragged ? 'scale-110 ring-2 ring-primary' : ''}
            ${isMerging ? 'ring-4 ring-accent animate-pulse' : ''}
            ${isSplitting ? 'ring-4 ring-secondary animate-pulse' : ''}
          `}
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {renderContent()}
          
          {/* Connector points */}
          {type === 'card' && !isBeingDragged && (
            <>
              <CardConnector
                position="left"
                isActive={activeConnector === `${id}-left`}
                isHovered={hoveredConnector === `${id}-left`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectorGrab?.(`${id}-left`);
                }}
              />
              <CardConnector
                position="right"
                isActive={activeConnector === `${id}-right`}
                isHovered={hoveredConnector === `${id}-right`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectorGrab?.(`${id}-right`);
                }}
              />
              <CardConnector
                position="top"
                isActive={activeConnector === `${id}-top`}
                isHovered={hoveredConnector === `${id}-top`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectorGrab?.(`${id}-top`);
                }}
              />
              <CardConnector
                position="bottom"
                isActive={activeConnector === `${id}-bottom`}
                isHovered={hoveredConnector === `${id}-bottom`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectorGrab?.(`${id}-bottom`);
                }}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
});

InteractiveObject.displayName = 'InteractiveObject';

export default InteractiveObject;
