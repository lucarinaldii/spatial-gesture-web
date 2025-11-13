import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandSkeleton from '@/components/HandSkeleton';
import InteractiveCard from '@/components/InteractiveCard';
import { useToast } from '@/hooks/use-toast';

interface CardData {
  id: string;
  title: string;
  description: string;
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
  
  const [cards, setCards] = useState<CardData[]>([
    {
      id: '1',
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
      title: 'Spatial Card 3',
      description: 'Point and pinch for seamless interaction',
      position: { x: 80, y: 35 },
      zIndex: 3,
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0 },
      isPhysicsEnabled: false,
    },
  ]);
  
  const [grabbedCards, setGrabbedCards] = useState<Map<number, {
    id: string;
    offsetX: number;
    offsetY: number;
  }>>(new Map());
  
  const [cardScales, setCardScales] = useState<Map<string, number>>(new Map());
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const lastPinchStates = useRef<Map<number, boolean>>(new Map());
  const animationFrameRef = useRef<number>();
  const maxZIndexRef = useRef(3);
  const baseDistanceRef = useRef<Map<string, number>>(new Map());
  const baseAngleRef = useRef<Map<string, number>>(new Map());
  const canvasDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasZoomBaseDistanceRef = useRef<number | null>(null);
  const openHandsPanRef = useRef<{ x: number; y: number } | null>(null);

  const handleStartTracking = async () => {
    setIsTracking(true);
    // Wait for React to render the video element
    setTimeout(async () => {
      await startCamera();
    }, 200);
  };

  // Multi-hand smooth dragging with RAF
  useEffect(() => {
    if (handPositions.length === 0) {
      if (grabbedCards.size > 0) {
        setGrabbedCards(new Map());
      }
      lastPinchStates.current.clear();
      openHandsPanRef.current = null;
      return;
    }

    const updateDrag = () => {
      const newGrabbedCards = new Map(grabbedCards);
      let hasChanges = false;
      const cardUpdates = new Map<string, { position?: { x: number; y: number }, zIndex?: number, rotation?: { x: number; y: number; z: number } }>();
      let scaleUpdate: { id: string; scale: number } | null = null;

      // Check if both hands are fully open (all fingers extended)
      const areBothHandsOpen = handPositions.length === 2 && 
        gestureStates.length === 2 &&
        gestureStates.every(gesture => 
          gesture && 
          !gesture.isPinching &&
          gesture.fingers.thumb.isExtended &&
          gesture.fingers.index.isExtended &&
          gesture.fingers.middle.isExtended &&
          gesture.fingers.ring.isExtended &&
          gesture.fingers.pinky.isExtended
        );

      // Handle open-hand canvas panning
      if (areBothHandsOpen) {
        const hand1X = handPositions[0].x * 100;
        const hand1Y = handPositions[0].y * 100;
        const hand2X = handPositions[1].x * 100;
        const hand2Y = handPositions[1].y * 100;
        
        const avgX = (hand1X + hand2X) / 2;
        const avgY = (hand1Y + hand2Y) / 2;
        
        if (!openHandsPanRef.current) {
          openHandsPanRef.current = { x: avgX, y: avgY };
        } else {
          const deltaX = avgX - openHandsPanRef.current.x;
          const deltaY = avgY - openHandsPanRef.current.y;
          
          setCanvasOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
          }));
          
          openHandsPanRef.current = { x: avgX, y: avgY };
        }
        
        // Skip card interaction when both hands are open
        return;
      } else {
        openHandsPanRef.current = null;
      }

      // Process each hand
      handPositions.forEach((handPos, handIndex) => {
        const gesture = gestureStates[handIndex];
        if (!gesture) return;

        const isPinching = gesture.isPinching;
        const handX = handPos.x * 100;
        const handY = handPos.y * 100;
        const wasPinching = lastPinchStates.current.get(handIndex) || false;

        // Start pinch - grab card or canvas
        if (isPinching && !wasPinching) {
          const cardWidth = 16;
          const cardHeight = 12;
          
          // Find card under hand - account for canvas offset
          const targetCard = cards.find((card) => {
            const adjustedX = card.position.x + canvasOffset.x;
            const adjustedY = card.position.y + canvasOffset.y;
            const dx = Math.abs(handX - adjustedX);
            const dy = Math.abs(handY - adjustedY);
            return dx < cardWidth && dy < cardHeight;
          });

          if (targetCard) {
            const adjustedX = targetCard.position.x + canvasOffset.x;
            const adjustedY = targetCard.position.y + canvasOffset.y;
            newGrabbedCards.set(handIndex, {
              id: targetCard.id,
              offsetX: handX - adjustedX,
              offsetY: handY - adjustedY,
            });
            hasChanges = true;
            
            // Bring card to front
            maxZIndexRef.current += 1;
            cardUpdates.set(targetCard.id, { 
              ...(cardUpdates.get(targetCard.id) || {}),
              zIndex: maxZIndexRef.current 
            });
            
            // Disable physics when grabbed
            setCards(prev => prev.map(card => 
              card.id === targetCard.id 
                ? { ...card, isPhysicsEnabled: false, velocity: { x: 0, y: 0 } }
                : card
            ));
          } else {
            // No card found - start canvas drag
            if (!canvasDragStartRef.current) {
              canvasDragStartRef.current = { x: handX, y: handY };
            }
          }
        }

        // Continue pinch - check if both hands grabbing same card for scaling
        if (isPinching) {
          const card0 = newGrabbedCards.get(0);
          const card1 = newGrabbedCards.get(1);
          
          // Check if dragging/zooming canvas (no cards grabbed)
          if (newGrabbedCards.size === 0) {
            // Two hands = zoom canvas
            if (handPositions.length === 2) {
              const hand1X = handPositions[0].x * 100;
              const hand1Y = handPositions[0].y * 100;
              const hand2X = handPositions[1].x * 100;
              const hand2Y = handPositions[1].y * 100;
              
              const distance = Math.sqrt(
                Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2)
              );
              
              if (!canvasZoomBaseDistanceRef.current) {
                canvasZoomBaseDistanceRef.current = distance;
              } else {
                const zoomFactor = distance / canvasZoomBaseDistanceRef.current;
                const newZoom = Math.max(0.5, Math.min(3, zoomFactor));
                setCanvasZoom(newZoom);
              }
              
              // Also update position to midpoint
              const midX = (hand1X + hand2X) / 2;
              const midY = (hand1Y + hand2Y) / 2;
              
              if (!canvasDragStartRef.current) {
                canvasDragStartRef.current = { x: midX, y: midY };
              } else {
                const deltaX = midX - canvasDragStartRef.current.x;
                const deltaY = midY - canvasDragStartRef.current.y;
                
                setCanvasOffset(prev => ({
                  x: prev.x + deltaX,
                  y: prev.y + deltaY
                }));
                
                canvasDragStartRef.current = { x: midX, y: midY };
              }
            }
            // One hand = drag canvas
            else if (canvasDragStartRef.current) {
              const deltaX = handX - canvasDragStartRef.current.x;
              const deltaY = handY - canvasDragStartRef.current.y;
              
              setCanvasOffset(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
              }));
              
              canvasDragStartRef.current = { x: handX, y: handY };
            }
          }
          // Both hands on same card = scale mode
          else if (card0 && card1 && card0.id === card1.id && handPositions.length === 2) {
            const hand1X = handPositions[0].x * 100;
            const hand1Y = handPositions[0].y * 100;
            const hand2X = handPositions[1].x * 100;
            const hand2Y = handPositions[1].y * 100;
            
            const distance = Math.sqrt(
              Math.pow(hand2X - hand1X, 2) + Math.pow(hand2Y - hand1Y, 2)
            );
            
            const baseDistance = baseDistanceRef.current.get(card0.id);
            const baseAngle = baseAngleRef.current.get(card0.id);
            const currentAngle = Math.atan2(hand2Y - hand1Y, hand2X - hand1X) * (180 / Math.PI);
            
            if (!baseDistance) {
              baseDistanceRef.current.set(card0.id, distance);
              baseAngleRef.current.set(card0.id, currentAngle);
            } else {
              // Scale
              const scaleFactor = distance / baseDistance;
              const newScale = Math.max(0.5, Math.min(3, scaleFactor));
              scaleUpdate = { id: card0.id, scale: newScale };
              
              // Rotate around Y-axis (vertical) based on distance change
              const distanceChange = distance - baseDistance;
              const yRotation = Math.max(-180, Math.min(180, distanceChange * 2));
              
              cardUpdates.set(card0.id, {
                ...(cardUpdates.get(card0.id) || {}),
                rotation: {
                  x: 0,          // No X tilt
                  y: yRotation,  // Rotate around vertical axis based on zoom
                  z: 0           // No Z spin
                }
              });
            }
            
            // Update position to midpoint between hands
            const midX = (hand1X + hand2X) / 2;
            const midY = (hand1Y + hand2Y) / 2;
            const newX = Math.max(5, Math.min(95, midX)) - canvasOffset.x;
            const newY = Math.max(5, Math.min(90, midY)) - canvasOffset.y;
            
            cardUpdates.set(card0.id, {
              ...(cardUpdates.get(card0.id) || {}),
              position: { x: newX, y: newY }
            });
          } else {
            // Single hand drag mode
            const grabbed = newGrabbedCards.get(handIndex);
            if (grabbed) {
              const newX = Math.max(5, Math.min(95, handX - grabbed.offsetX)) - canvasOffset.x;
              const newY = Math.max(5, Math.min(90, handY - grabbed.offsetY)) - canvasOffset.y;
              
              cardUpdates.set(grabbed.id, {
                ...(cardUpdates.get(grabbed.id) || {}),
                position: { x: newX, y: newY }
              });
            }
          }
        }

        // Release pinch - drop card or canvas
        if (!isPinching && wasPinching) {
          const grabbed = newGrabbedCards.get(handIndex);
          if (grabbed) {
            newGrabbedCards.delete(handIndex);
            hasChanges = true;
            
            // Reset base distance and angle for this card if no other hand is holding it
            const otherHandHolding = Array.from(newGrabbedCards.values()).some(g => g.id === grabbed.id);
            if (!otherHandHolding) {
              baseDistanceRef.current.delete(grabbed.id);
              baseAngleRef.current.delete(grabbed.id);
              
              // Enable physics for this card
              cardUpdates.set(grabbed.id, {
                ...(cardUpdates.get(grabbed.id) || {}),
              });
              
              setCards(prev => prev.map(card => 
                card.id === grabbed.id 
                  ? { ...card, isPhysicsEnabled: true, velocity: { x: 0, y: 0 } }
                  : card
              ));
            }
          } else {
            // Release canvas drag/zoom
            canvasDragStartRef.current = null;
            canvasZoomBaseDistanceRef.current = null;
          }
        }

        lastPinchStates.current.set(handIndex, isPinching);
      });

      // Batch all updates together to avoid multiple re-renders
      if (hasChanges) {
        setGrabbedCards(newGrabbedCards);
      }

      if (scaleUpdate) {
        setCardScales(prev => {
          const newScales = new Map(prev);
          newScales.set(scaleUpdate.id, scaleUpdate.scale);
          return newScales;
        });
      }

      if (cardUpdates.size > 0) {
        setCards(prev =>
          prev.map(card => {
            const update = cardUpdates.get(card.id);
            if (!update) return card;
            return {
              ...card,
              ...(update.position && { position: update.position }),
              ...(update.zIndex !== undefined && { zIndex: update.zIndex }),
              ...(update.rotation && { rotation: update.rotation }),
            };
          })
        );
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updateDrag);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handPositions, gestureStates, grabbedCards, cards, toast]);

  // Physics simulation for gravity
  useEffect(() => {
    const GRAVITY = 0.5; // Gravity acceleration
    const FLOOR_Y = 85; // Floor position (percentage)
    const BOUNCE_DAMPING = 0.6; // Energy loss on bounce
    const FRICTION = 0.98; // Horizontal friction
    
    const physicsLoop = () => {
      setCards(prev => prev.map(card => {
        if (!card.isPhysicsEnabled) return card;
        
        // Apply gravity
        let newVelocityY = card.velocity.y + GRAVITY;
        let newVelocityX = card.velocity.x * FRICTION;
        let newY = card.position.y + newVelocityY;
        let newX = card.position.x + newVelocityX;
        
        // Floor collision
        if (newY >= FLOOR_Y) {
          newY = FLOOR_Y;
          newVelocityY = -newVelocityY * BOUNCE_DAMPING;
          
          // Stop physics if barely moving
          if (Math.abs(newVelocityY) < 0.5 && Math.abs(newVelocityX) < 0.1) {
            return {
              ...card,
              position: { x: newX, y: FLOOR_Y },
              velocity: { x: 0, y: 0 },
              isPhysicsEnabled: false,
            };
          }
        }
        
        // Side boundaries
        if (newX < 5) {
          newX = 5;
          newVelocityX = -newVelocityX * BOUNCE_DAMPING;
        } else if (newX > 95) {
          newX = 95;
          newVelocityX = -newVelocityX * BOUNCE_DAMPING;
        }
        
        return {
          ...card,
          position: { x: newX, y: newY },
          velocity: { x: newVelocityX, y: newVelocityY },
        };
      }));
    };
    
    const intervalId = setInterval(physicsLoop, 1000 / 60); // 60 FPS
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" />
      

      {/* Main content */}
      <div className="relative z-10">
        {!isTracking ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="text-center space-y-6 max-w-2xl">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Spatial UI Controller
              </h1>
              <p className="text-xl text-muted-foreground">
                Control your interface with natural hand gestures
              </p>
              
              <div className="space-y-4 pt-8">
                <div className="glass-panel p-6 text-left space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Available Gestures:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong className="text-primary">Point:</strong> Move your index finger to control the cursor</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      <span><strong className="text-secondary">Pinch:</strong> Touch thumb and index finger to click</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span><strong className="text-accent">Hover:</strong> Point at cards to see interactions</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleStartTracking}
                  disabled={!isReady}
                  size="lg"
                  className="text-lg px-8 py-6 neon-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isReady ? 'Start Hand Tracking' : 'Loading Model...'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative min-h-screen">
            {/* Hidden video element for tracking */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="fixed -left-[9999px] opacity-0 pointer-events-none"
            />
            
            {/* Zoomable canvas container */}
            <div 
              className="absolute inset-0 origin-center transition-transform duration-200"
              style={{
                transform: `scale(${canvasZoom})`,
                willChange: 'transform',
              }}
            >
              {/* Interactive draggable cards with z-index */}
              {cards
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((card) => {
                  const isBeingDragged = Array.from(grabbedCards.values()).some(g => g.id === card.id);
                  const handIndex = Array.from(grabbedCards.entries()).find(([_, g]) => g.id === card.id)?.[0];
                  const handPos = handIndex !== undefined ? handPositions[handIndex] : null;
                  const gesture = handIndex !== undefined ? gestureStates[handIndex] : null;
                  
                  // Apply canvas offset to card position
                  const adjustedPosition = {
                    x: card.position.x + canvasOffset.x,
                    y: card.position.y + canvasOffset.y
                  };
                  
                  return (
                    <InteractiveCard
                      key={card.id}
                      title={card.title}
                      description={card.description}
                      position={adjustedPosition}
                      rotation={card.rotation}
                      zIndex={card.zIndex}
                      handPosition={handPos}
                      gestureState={gesture || { 
                        isPinching: false, 
                        isPointing: false, 
                        pinchStrength: 0, 
                        handIndex: 0,
                        fingers: {
                          thumb: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } },
                          index: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } },
                          middle: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } },
                          ring: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } },
                          pinky: { isExtended: false, tipPosition: { x: 0, y: 0, z: 0 } }
                        }
                      }}
                      onInteract={() => {}}
                      isBeingDragged={isBeingDragged}
                      scale={cardScales.get(card.id) || 1}
                    />
                  );
                })}
            </div>

            {/* Hand skeleton overlay */}
            {videoRef.current && (
              <HandSkeleton 
                landmarks={landmarks} 
                videoWidth={videoRef.current.videoWidth || 640}
                videoHeight={videoRef.current.videoHeight || 480}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
