import { useState, useEffect } from 'react';
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
}

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { isReady, handPosition, gestureState, landmarks, videoRef, startCamera } = useHandTracking();
  const { toast } = useToast();
  
  const [cards, setCards] = useState<CardData[]>([
    {
      id: '1',
      title: 'Spatial Card 1',
      description: 'Hover with your hand and pinch to drag',
      position: { x: 20, y: 30 },
    },
    {
      id: '2',
      title: 'Spatial Card 2',
      description: 'Experience natural gesture controls',
      position: { x: 50, y: 50 },
    },
    {
      id: '3',
      title: 'Spatial Card 3',
      description: 'Point and pinch for seamless interaction',
      position: { x: 80, y: 30 },
    },
  ]);
  
  const [grabbedCard, setGrabbedCard] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [wasPinching, setWasPinching] = useState(false);

  const handleStartTracking = async () => {
    setIsTracking(true);
    // Wait for React to render the video element
    setTimeout(async () => {
      await startCamera();
      toast({
        title: "Hand Tracking Active",
        description: "Move your hand to control the cursor. Pinch to click!",
      });
    }, 200);
  };

  // Handle dragging logic
  useEffect(() => {
    if (!handPosition) return;

    const isPinching = gestureState.isPinching;
    const handX = handPosition.x * 100; // Convert to percentage
    const handY = handPosition.y * 100;

    // Pinch started - grab card if hovering over one
    if (isPinching && !wasPinching && !grabbedCard) {
      const cardUnderHand = cards.find((card) => {
        const cardWidth = 300; // Approximate card width in px
        const cardHeight = 200; // Approximate card height in px
        const cardLeft = (card.position.x * window.innerWidth) / 100;
        const cardTop = (card.position.y * window.innerHeight) / 100;
        const handPxX = (handX * window.innerWidth) / 100;
        const handPxY = (handY * window.innerHeight) / 100;
        
        return (
          handPxX >= cardLeft &&
          handPxX <= cardLeft + cardWidth &&
          handPxY >= cardTop &&
          handPxY <= cardTop + cardHeight
        );
      });

      if (cardUnderHand) {
        setGrabbedCard({
          id: cardUnderHand.id,
          offsetX: handX - cardUnderHand.position.x,
          offsetY: handY - cardUnderHand.position.y,
        });
        toast({
          title: "Card Grabbed!",
          description: `Holding ${cardUnderHand.title}`,
        });
      }
    }

    // Pinch held - update card position
    if (isPinching && grabbedCard) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === grabbedCard.id
            ? {
                ...card,
                position: {
                  x: Math.max(0, Math.min(90, handX - grabbedCard.offsetX)),
                  y: Math.max(0, Math.min(85, handY - grabbedCard.offsetY)),
                },
              }
            : card
        )
      );
    }

    // Pinch released - drop card
    if (!isPinching && wasPinching && grabbedCard) {
      toast({
        title: "Card Released",
        description: "Card dropped at new position",
      });
      setGrabbedCard(null);
    }

    setWasPinching(isPinching);
  }, [handPosition, gestureState, grabbedCard, wasPinching, cards, toast]);

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
                  <div className={`w-3 h-3 rounded-full ${handPosition ? 'bg-primary' : 'bg-muted'} animate-pulse`} />
                  <span className="text-sm font-mono text-foreground font-bold">
                    {handPosition ? 'HAND DETECTED ✓' : 'NO HAND - SHOW YOUR HAND'}
                  </span>
                </div>
                {landmarks && landmarks.length > 0 && (
                  <div className="text-xs font-mono text-primary">
                    Landmarks: {landmarks[0]?.length || 0} points tracked
                  </div>
                )}
              </div>
            </div>

            {/* Interactive draggable cards */}
            {cards.map((card) => (
              <InteractiveCard
                key={card.id}
                title={card.title}
                description={card.description}
                position={card.position}
                handPosition={handPosition}
                gestureState={gestureState}
                onInteract={() => {}}
                isBeingDragged={grabbedCard?.id === card.id}
              />
            ))}

            {/* Center info */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full border border-primary/30">
              <p className="text-sm font-mono text-muted-foreground">
                {gestureState.isPinching ? (
                  <span className="text-secondary">🤏 Pinching - Click Active</span>
                ) : handPosition ? (
                  <span className="text-primary">👆 Pointing - Move to Navigate</span>
                ) : (
                  <span>🖐️ Show your hand to the camera</span>
                )}
              </p>
            </div>

            {/* Hand cursor */}
            <HandCursor position={handPosition} gestureState={gestureState} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
