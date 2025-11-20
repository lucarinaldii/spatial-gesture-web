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

    const setupConnection = async () => {
      // Sign in anonymously for realtime access
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Anonymous sign in error:', error);
        addDebugLog(`Auth error: ${error.message}`);
        toast({
          title: "Connection Error",
          description: "Could not connect to streaming service",
          variant: "destructive",
        });
        return;
      }

      addDebugLog('Anonymous auth successful');

      // Set up realtime channel for sending landmarks
      const channel = supabase.channel(`hand-tracking-${sessionId}`, {
        config: {
          broadcast: { self: false },
        },
      });
      channelRef.current = channel;

      channel.subscribe((status) => {
        addDebugLog(`Channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          addDebugLog('Channel ready to send landmarks');
        }
      });
    };

    setupConnection();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, navigate, toast]);

  // Send landmarks to desktop when they update
  useEffect(() => {
    if (!landmarks || !channelRef.current || landmarks.length === 0) return;

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

    sendLandmarks();
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
            <div className="relative w-full max-w-md mx-auto aspect-video bg-background/50 rounded-lg border-2 border-primary">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-10"
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
              <div className="absolute bottom-2 right-2 text-xs text-primary font-mono bg-background/80 px-2 py-1 rounded">
                {landmarks?.length || 0} landmarks
              </div>
            </div>
          </div>
        )}
      </div>
      <DebugPanel title="Mobile Tracking Logs" logs={debugLogs} position="bottom-right" />
    </div>
  );
};

export default MobileCamera;
