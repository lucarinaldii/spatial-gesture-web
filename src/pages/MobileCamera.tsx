import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHandTracking } from '@/hooks/useHandTracking';

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
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'ready' | 'camera-loading' | 'error'>('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const hasAttemptedCameraStart = useRef(false);

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
        addDebugLog('Setting up realtime channel');

        if (!mounted) return;

        // Set up realtime channel for sending landmarks (no auth required)
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

  // Automatically start camera when MediaPipe and channel are ready
  useEffect(() => {
    if (isReady && isChannelReady && !hasAttemptedCameraStart.current) {
      hasAttemptedCameraStart.current = true;
      addDebugLog('All systems ready - Starting camera automatically');
      setLoadingStatus('camera-loading');
      
      const initCamera = async () => {
        try {
          await startCamera();
          setIsTracking(true);
          setLoadingStatus('ready');
          addDebugLog('Camera started successfully');
          
          toast({
            title: "Ready to Track",
            description: "Move your hands to control the desktop",
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to start camera:', error);
          addDebugLog(`Camera error: ${errorMsg}`);
          setCameraError(errorMsg);
          setLoadingStatus('error');
        }
      };
      
      initCamera();
    }
  }, [isReady, isChannelReady, startCamera, toast]);

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

  const handleRetryCamera = async () => {
    setCameraError(null);
    setLoadingStatus('camera-loading');
    hasAttemptedCameraStart.current = false;
    
    try {
      addDebugLog('Retrying camera access...');
      await startCamera();
      setIsTracking(true);
      setLoadingStatus('ready');
      addDebugLog('Camera started successfully on retry');
      
      toast({
        title: "Camera Started",
        description: "Tracking is now active",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start camera on retry:', error);
      addDebugLog(`Retry failed: ${errorMsg}`);
      setCameraError(errorMsg);
      setLoadingStatus('error');
      
      toast({
        title: "Camera Error",
        description: errorMsg.includes('Permission') 
          ? "Please allow camera access in your browser settings"
          : "Failed to access camera. Try again or refresh the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 w-full">
        {loadingStatus === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium text-foreground">
              Loading...
            </p>
          </div>
        )}

        {loadingStatus === 'camera-loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium text-foreground">
              Starting camera...
            </p>
          </div>
        )}
        
        {isTracking && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Tracking Active
            </p>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
          </div>
        )}

        {loadingStatus === 'error' && (
          <div className="px-4">
            <div className="p-6 bg-destructive/10 border border-destructive rounded-lg max-w-md mx-auto">
              <p className="text-lg font-semibold text-destructive mb-3 text-center">
                Camera Error
              </p>
              {cameraError && (
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  {cameraError.includes('Permission') || cameraError.includes('NotAllowedError')
                    ? "Please enable camera access in your browser settings"
                    : cameraError.includes('NotFoundError')
                    ? "No camera found on your device"
                    : "Failed to start camera"}
                </p>
              )}
              <button
                onClick={handleRetryCamera}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCamera;
