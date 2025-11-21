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
  const { isReady, isInitializing, loadingProgress, loadingStage, landmarks, handedness, videoRef, startCamera } = useHandTracking();
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

    const setupConnection = async (attempt = 1) => {
      try {
        addDebugLog(`Setting up realtime channel... (attempt ${attempt})`);

        const channel = supabase.channel(`hand-tracking-${sessionId}`, {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel.subscribe((status, error) => {
          if (!mounted) return;
          addDebugLog(`Channel status: ${status}`);
          
          if (error) {
            addDebugLog(`Channel error: ${error.message || JSON.stringify(error)}`);
            toast({
              title: "Connection Issue",
              description: error.message || "Please refresh and try again",
              variant: "destructive",
            });
          }
          
          if (status === 'SUBSCRIBED') {
            addDebugLog('Channel ready to send landmarks');
            toast({
              title: "Connected",
              description: "Hand tracking ready",
            });
          } else if (status === 'CHANNEL_ERROR') {
            addDebugLog('Channel error occurred');
            if (attempt < 3) {
              addDebugLog(`Retrying connection... (${attempt}/3)`);
              setTimeout(() => {
                channel.unsubscribe();
                setupConnection(attempt + 1);
              }, 1000);
            } else {
              const errorMsg = error?.message || "Unable to establish connection after 3 attempts";
              toast({
                title: "Connection Failed",
                description: errorMsg,
                variant: "destructive",
              });
            }
          }
        });
      } catch (error) {
        console.error('Setup error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addDebugLog(`Setup error: ${errorMsg}`);
        toast({
          title: "Setup Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    };

    setupConnection();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, navigate, toast]);

  // Send landmarks to desktop continuously
  useEffect(() => {
    if (!landmarks || !channelRef.current || landmarks.length === 0) return;

    const sendLandmarks = async () => {
      try {
        addDebugLog('Sending landmarks frame to desktop');
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
        addDebugLog(`Error sending landmarks: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    };

    // Send immediately
    sendLandmarks();

    // Then send at ~30fps for smooth updates
    const intervalId = setInterval(sendLandmarks, 33);

    return () => clearInterval(intervalId);
  }, [landmarks, handedness]);

  const handleStartTracking = async () => {
    addDebugLog('Starting hand tracking on mobile');
    setIsTracking(true);
    
    try {
      if (videoRef.current) {
        await startCamera();
        addDebugLog('Camera started, tracking active');
        toast({
          title: "Tracking Started",
          description: "Hand tracking is now active",
        });
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      addDebugLog(`Camera error: ${error instanceof Error ? error.message : 'Unknown'}`);
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsTracking(false);
    }
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
            <div className="space-y-3">
              <button
                onClick={handleStartTracking}
                disabled={isInitializing}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 w-full"
              >
                {isInitializing ? 'Loading AI Model...' : 'Start Hand Tracking'}
              </button>
              {isInitializing && (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {loadingStage === 'wasm' && 'Loading WebAssembly...'}
                    {loadingStage === 'model' && 'Loading AI Model...'}
                    {loadingStage === 'ready' && 'Ready!'}
                    {' '}({loadingProgress}%)
                  </p>
                </div>
              )}
            </div>
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
      {/* Mobile Debug Panel for handshake & tracking */}
      <DebugPanel title="Mobile Realtime" logs={debugLogs} />
    </div>
  );
};

export default MobileCamera;
