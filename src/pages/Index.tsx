import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandCursor from '@/components/HandCursor';
import HandSkeleton from '@/components/HandSkeleton';
import InteractiveCard from '@/components/InteractiveCard';
import { useToast } from '@/hooks/use-toast';

interface CardData {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  zIndex: number;
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
    },
    {
      id: '2',
      title: 'Spatial Card 2',
      description: 'Experience natural gesture controls',
      position: { x: 50, y: 50 },
      zIndex: 2,
    },
    {
      id: '3',
      title: 'Spatial Card 3',
      description: 'Point and pinch for seamless interaction',
      position: { x: 80, y: 35 },
      zIndex: 3,
    },
  ]);
  
  const [grabbedCards, setGrabbedCards] = useState<Map<number, {
    id: string;
    offsetX: number;
    offsetY: number;
  }>>(new Map());
  
  const [cardScales, setCardScales] = useState<Map<string, number>>(new Map());
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const lastPinchStates = useRef<Map<number, boolean>>(new Map());
  const animationFrameRef = useRef<number>();
  const maxZIndexRef = useRef(3);
  const baseDistanceRef = useRef<Map<string, number>>(new Map());
  const canvasDragStartRef = useRef<{ x: number; y: number } | null>(null);

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
      return;
    }

    const updateDrag = () => {
      const newGrabbedCards = new Map(grabbedCards);
      let hasChanges = false;
      const cardUpdates = new Map<string, { position?: { x: number; y: number }, zIndex?: number }>();
      let scaleUpdate: { id: string; scale: number } | null = null;

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
          
          // Find card under hand (allow multiple hands on same card)
          const targetCard = cards.find((card) => {
            const dx = Math.abs(handX - card.position.x);
            const dy = Math.abs(handY - card.position.y);
            return dx < cardWidth && dy < cardHeight;
          });

          if (targetCard) {
            newGrabbedCards.set(handIndex, {
              id: targetCard.id,
              offsetX: handX - targetCard.position.x,
              offsetY: handY - targetCard.position.y,
            });
            hasChanges = true;
            
            // Bring card to front
            maxZIndexRef.current += 1;
            cardUpdates.set(targetCard.id, { 
              ...(cardUpdates.get(targetCard.id) || {}),
              zIndex: maxZIndexRef.current 
            });
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
          
          // Check if dragging canvas (no cards grabbed)
          if (newGrabbedCards.size === 0 && canvasDragStartRef.current) {
            const deltaX = handX - canvasDragStartRef.current.x;
            const deltaY = handY - canvasDragStartRef.current.y;
            
            setCanvasOffset(prev => ({
              x: prev.x + deltaX,
              y: prev.y + deltaY
            }));
            
            canvasDragStartRef.current = { x: handX, y: handY };
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
            if (!baseDistance) {
              baseDistanceRef.current.set(card0.id, distance);
            } else {
              const scaleFactor = distance / baseDistance;
              const newScale = Math.max(0.5, Math.min(3, scaleFactor));
              scaleUpdate = { id: card0.id, scale: newScale };
            }
            
            // Update position to midpoint between hands
            const midX = (hand1X + hand2X) / 2;
            const midY = (hand1Y + hand2Y) / 2;
            const newX = Math.max(5, Math.min(95, midX));
            const newY = Math.max(5, Math.min(90, midY));
            
            cardUpdates.set(card0.id, {
              ...(cardUpdates.get(card0.id) || {}),
              position: { x: newX, y: newY }
            });
          } else {
            // Single hand drag mode
            const grabbed = newGrabbedCards.get(handIndex);
            if (grabbed) {
              const newX = Math.max(5, Math.min(95, handX - grabbed.offsetX));
              const newY = Math.max(5, Math.min(90, handY - grabbed.offsetY));
              
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
            
            // Reset base distance for this card if no other hand is holding it
            const otherHandHolding = Array.from(newGrabbedCards.values()).some(g => g.id === grabbed.id);
            if (!otherHandHolding) {
              baseDistanceRef.current.delete(grabbed.id);
            }
          } else {
            // Release canvas drag
            canvasDragStartRef.current = null;
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
            
            {/* Status indicator */}
            <div className="fixed top-4 left-4 glass-panel px-4 py-3 rounded-lg z-50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${handPositions.length > 0 ? 'bg-primary' : 'bg-muted'} animate-pulse`} />
                  <span className="text-sm font-mono text-foreground font-bold">
                    {handPositions.length > 0 
                      ? `${handPositions.length} HAND${handPositions.length > 1 ? 'S' : ''} DETECTED ✓` 
                      : 'NO HANDS - SHOW YOUR HANDS'}
                  </span>
                </div>
                {landmarks && landmarks.length > 0 && (
                  <div className="text-xs font-mono text-primary">
                    {landmarks.map((_: any, i: number) => (
                      <div key={i}>Hand {i + 1}: {landmarks[i]?.length || 0} points</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                    zIndex={card.zIndex}
                    handPosition={handPos}
                    gestureState={gesture || { isPinching: false, isPointing: false, pinchStrength: 0, handIndex: 0 }}
                    onInteract={() => {}}
                    isBeingDragged={isBeingDragged}
                    scale={cardScales.get(card.id) || 1}
                  />
                );
              })}

            {/* Center info */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full border border-primary/30">
              <p className="text-sm font-mono text-muted-foreground">
                {(() => {
                  const bothGrabbingSame = handPositions.length === 2 && 
                    gestureStates.every(g => g.isPinching) &&
                    grabbedCards.get(0)?.id === grabbedCards.get(1)?.id &&
                    grabbedCards.get(0);
                  
                  if (bothGrabbingSame) {
                    const scale = cardScales.get(bothGrabbingSame.id) || 1;
                    return <span className="text-accent">🔍 Scaling: {(scale * 100).toFixed(0)}% - Spread/close hands</span>;
                  } else if (gestureStates.some(g => g.isPinching)) {
                    return <span className="text-secondary">🤏 Pinching - {gestureStates.filter(g => g.isPinching).length} hand(s) active</span>;
                  } else if (handPositions.length > 0) {
                    return <span className="text-primary">👆 {handPositions.length} hand(s) detected - Pinch to grab cards</span>;
                  } else {
                    return <span>🖐️ Show your hands to the camera</span>;
                  }
                })()}
              </p>
            </div>

            {/* Hand cursors for each hand */}
            {handPositions.map((pos, index) => (
              <HandCursor
                key={index}
                position={pos}
                gestureState={gestureStates[index] || { isPinching: false, isPointing: false, pinchStrength: 0, handIndex: index }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
