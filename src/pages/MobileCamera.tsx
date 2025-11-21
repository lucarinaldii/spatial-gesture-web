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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing...');

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
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && mounted) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            // If rate limited, continue anyway - realtime might still work
            if (error.status === 429) {
              addDebugLog('Rate limited, continuing with existing connection');
            } else {
              console.error('Anonymous sign in error:', error);
              addDebugLog(`Auth error: ${error.message}`);
              toast({
                title: "Connection Warning",
                description: "Using fallback connection mode",
                variant: "default",
              });
            }
          } else {
            addDebugLog('Anonymous auth successful');
          }
        } else {
          addDebugLog('Using existing auth session');
        }

        if (!mounted) return;

        // Set up realtime channel for sending landmarks
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
    setCameraError(null);
    setLoadingStep('Requesting camera access...');
    
    try {
      setIsTracking(true);
      setLoadingStep('Starting camera...');
      
      if (videoRef.current) {
        await startCamera();
        addDebugLog('Camera started, tracking active');
        setLoadingStep('');
      }
    } catch (error) {
      console.error('Camera error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to access camera';
      setCameraError(errorMsg);
      addDebugLog(`Camera error: ${errorMsg}`);
      setIsTracking(false);
      
      toast({
        title: "Camera Error",
        description: "Please allow camera access and try again",
        variant: "destructive",
      });
    }
  };

  // Auto-start tracking when MediaPipe is ready
  useEffect(() => {
    if (isReady && !isTracking && !cameraError) {
      addDebugLog('MediaPipe ready, auto-starting camera');
      handleStartTracking();
    }
  }, [isReady]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-foreground">Hand Tracking</h1>
        <p className="text-muted-foreground text-sm">
          Session: {sessionId}
        </p>

        {cameraError ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <p className="text-destructive font-semibold mb-2">Camera Error</p>
              <p className="text-sm text-muted-foreground">{cameraError}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please check your camera permissions in browser settings
            </p>
            <button
              onClick={handleStartTracking}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : !isReady ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/20"></div>
              <p className="text-lg text-primary font-medium">{loadingStep}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Setting up hand tracking...
            </p>
          </div>
        ) : !isTracking ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <p className="text-lg text-primary font-medium">{loadingStep}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Preparing camera...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✓ Tracking Active
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Move your hands to control the desktop interface
            </p>
            <div className="relative w-full mx-auto aspect-video bg-black/5 rounded-lg overflow-hidden border border-border">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
              />
              {landmarks && landmarks.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">Show your hand to the camera</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono">
              <div className={`h-2 w-2 rounded-full ${landmarks?.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-muted-foreground">
                {landmarks?.length > 0 ? `${landmarks.length} hand(s) detected` : 'No hands detected'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCamera;
