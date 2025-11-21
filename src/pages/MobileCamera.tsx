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
  const { isReady, landmarks, handedness, videoRef, startCamera } = useHandTracking(true);
  const [isTracking, setIsTracking] = useState(false);
  const [isChannelReady, setIsChannelReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
        setLoadingStatus('loading');
        
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
            setIsChannelReady(true);
          }
        });
      } catch (error) {
        console.error('Setup error:', error);
        addDebugLog(`Setup error: ${error instanceof Error ? error.message : 'Unknown'}`);
        setLoadingStatus('error');
      }
    };

    setupConnection();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, navigate, toast]);

  // Update loading status when everything is ready
  useEffect(() => {
    if (isReady && isChannelReady) {
      setLoadingStatus('ready');
      addDebugLog('All systems ready - MediaPipe and channel initialized');
    }
  }, [isReady, isChannelReady]);

  // Send landmarks to desktop when they update - throttled for performance
  useEffect(() => {
    if (!landmarks || !channelRef.current || landmarks.length === 0) return;

    // Throttle to ~30fps for smooth performance
    const timeoutId = setTimeout(() => {
      channelRef.current.send({
        type: 'broadcast',
        event: 'landmarks',
        payload: {
          landmarks,
          handedness,
          timestamp: Date.now(),
        }
      }).catch((error: Error) => {
        console.error('Error sending landmarks:', error);
      });
    }, 33); // ~30fps

    return () => clearTimeout(timeoutId);
  }, [landmarks, handedness]);

  const handleStartTracking = async () => {
    try {
      addDebugLog('Starting hand tracking on mobile');
      setIsTracking(true);
      
      // Start camera immediately - no delay
      await startCamera();
      addDebugLog('Camera started, tracking active');
      
      toast({
        title: "Tracking Started",
        description: "Move your hands to control the desktop",
      });
    } catch (error) {
      console.error('Failed to start tracking:', error);
      addDebugLog(`Failed to start camera: ${error instanceof Error ? error.message : 'Unknown'}`);
      setIsTracking(false);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-foreground">Hand Tracking</h1>
        <p className="text-muted-foreground">
          Session: {sessionId}
        </p>

        {loadingStatus === 'loading' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg text-muted-foreground">
                Initializing hand tracking system...
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✓ Loading AI models</p>
                <p className={isChannelReady ? "text-green-600 dark:text-green-400" : ""}>
                  {isChannelReady ? "✓" : "⏳"} Connecting to desktop
                </p>
                <p className={isReady ? "text-green-600 dark:text-green-400" : ""}>
                  {isReady ? "✓" : "⏳"} Preparing camera system
                </p>
              </div>
            </div>
          </div>
        )}

        {loadingStatus === 'ready' && !isTracking && (
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Your hand movements will control the desktop interface
            </p>
            <button
              onClick={handleStartTracking}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Hand Tracking
            </button>
          </div>
        )}
        
        {isTracking && (
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
              {landmarks?.length || 0} hands detected
            </div>
          </div>
        )}

        {loadingStatus === 'error' && (
          <div className="space-y-4">
            <p className="text-lg text-destructive">
              Failed to initialize. Please refresh and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCamera;
