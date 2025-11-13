import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHandTracking } from '@/hooks/useHandTracking';
import HandCursor from '@/components/HandCursor';
import HandSkeleton from '@/components/HandSkeleton';
import InteractiveCard from '@/components/InteractiveCard';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { isReady, handPosition, gestureState, landmarks, videoRef, startCamera } = useHandTracking();
  const { toast } = useToast();

  const handleStartTracking = async () => {
    await startCamera();
    setIsTracking(true);
    toast({
      title: "Hand Tracking Active",
      description: "Move your hand to control the cursor. Pinch to click!",
    });
  };

  const handleCardInteract = (cardName: string) => {
    toast({
      title: "Card Activated!",
      description: `You clicked on ${cardName}`,
    });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" />
      
      {/* Video feed (offscreen for initialization) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed -left-[9999px] w-[1px] h-[1px]"
      />

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
            {/* Fullscreen video preview with skeleton overlay */}
            <div className="fixed inset-0 z-40 bg-black">
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
                <HandSkeleton
                  landmarks={landmarks}
                  videoWidth={window.innerWidth}
                  videoHeight={window.innerHeight}
                />
              
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-4 left-4 glass-panel px-4 py-3 rounded-lg z-50">
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
            </div>

            {/* Interactive cards */}
            <InteractiveCard
              title="Spatial Card 1"
              description="Hover with your hand and pinch to interact"
              position={{ x: 25, y: 40 }}
              handPosition={handPosition}
              gestureState={gestureState}
              onInteract={() => handleCardInteract('Spatial Card 1')}
            />

            <InteractiveCard
              title="Spatial Card 2"
              description="Experience natural gesture controls"
              position={{ x: 50, y: 50 }}
              handPosition={handPosition}
              gestureState={gestureState}
              onInteract={() => handleCardInteract('Spatial Card 2')}
            />

            <InteractiveCard
              title="Spatial Card 3"
              description="Point and pinch for seamless interaction"
              position={{ x: 75, y: 40 }}
              handPosition={handPosition}
              gestureState={gestureState}
              onInteract={() => handleCardInteract('Spatial Card 3')}
            />

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
