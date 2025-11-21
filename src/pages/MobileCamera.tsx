import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHandTracking } from '@/hooks/useHandTracking';
import { DebugPanel } from '@/components/DebugPanel';
import HandSkeleton from '@/components/HandSkeleton';

const MobileCamera = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session');
  const channelRef = useRef<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const { isReady, landmarks, handedness, videoRef, startCamera } = useHandTracking();
  const [isTracking, setIsTracking] = useState(false);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1]?.split('.')[0] ?? '';
    const entry = `[${timestamp}] ${message}`;
    console.log(entry);
    setDebugLogs((prev) => [...prev.slice(-49), entry]);
  };

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    let mounted = true;

    const setupConnection = async () => {
      try {
        addDebugLog('Setting up realtime channel...');

        // Set up realtime channel for sending landmarks (no auth required for broadcast)
        const channel = supabase.channel(`hand-tracking-${sessionId}`, {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel.subscribe((status) => {
          if (!mounted) return;
          addDebugLog(`Channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            addDebugLog('Channel ready to send landmarks');
            toast({
              title: "Connected",
              description: "Hand tracking ready",
            });
          } else if (status === 'CHANNEL_ERROR') {
            addDebugLog('Channel error');
            toast({
              title: "Connection Error",
              description: "Unable to connect. Please refresh and try again.",
              variant: "destructive",
            });
          }
        });
      } catch (error) {
        console.error('Setup error:', error);
        addDebugLog(`Setup error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    };

    setupConnection();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, navigate, toast]);

  // Send landmarks to desktop with throttling for smoother performance
  useEffect(() => {
    if (!landmarks || !channelRef.current || landmarks.length === 0) return;

    // Throttle to ~30fps for optimal balance between smoothness and bandwidth
    const throttleDelay = 33; // ~30fps
    let timeoutId: NodeJS.Timeout;

    const sendLandmarks = async () => {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'landmarks',
          payload: {
            landmarks,
            handedness,
            timestamp: Date.now(),
          }
        });
      } catch (error) {
        console.error('Error sending landmarks:', error);
      }
    };

    timeoutId = setTimeout(sendLandmarks, throttleDelay);

    return () => clearTimeout(timeoutId);
  }, [landmarks, handedness]);

  const handleStartTracking = async () => {
    addDebugLog('Starting hand tracking on mobile');
    setIsTracking(true);
    
    setTimeout(async () => {
      if (videoRef.current) {
        await startCamera();
        addDebugLog('Camera started, tracking active');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold text-foreground">Hand Tracking</h1>
        <p className="text-muted-foreground">
          Session: {sessionId}
        </p>

        {!isTracking ? (
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Your hand movements will control the desktop interface
            </p>
            <button
              onClick={handleStartTracking}
              disabled={!isReady}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
            >
              {isReady ? 'Start Hand Tracking' : 'Loading...'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Tracking Active - Move your hands
            </p>
            <div className="relative w-full max-w-md mx-auto aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
              />
              {landmarks && landmarks.length > 0 && (
                <HandSkeleton
                  landmarks={landmarks}
                  videoWidth={videoRef.current?.videoWidth || 640}
                  videoHeight={videoRef.current?.videoHeight || 480}
                  handedness={handedness}
                  alignmentParams={{
                    leftHand: {
                      skeletonScale: 1,
                      skeletonXOffset: 0,
                      skeletonYOffset: 0,
                      skeletonZDepth: 0,
                      hand3DScale: 1,
                      hand3DXOffset: 0,
                      hand3DYOffset: 0,
                      hand3DZDepth: 0,
                    },
                    rightHand: {
                      skeletonScale: 1,
                      skeletonXOffset: 0,
                      skeletonYOffset: 0,
                      skeletonZDepth: 0,
                      hand3DScale: 1,
                      hand3DXOffset: 0,
                      hand3DYOffset: 0,
                      hand3DZDepth: 0,
                    },
                  }}
                />
              )}
            </div>
            <div className="text-xs text-primary font-mono text-center">
              {landmarks?.length || 0} landmarks
            </div>
          </div>
        )}
      </div>
      {/* Debug panel removed */}
    </div>
  );
};

export default MobileCamera;
