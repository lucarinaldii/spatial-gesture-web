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

  // Update loading status when system is ready
  useEffect(() => {
    if (isReady && isChannelReady) {
      setLoadingStatus('ready');
      addDebugLog('System ready - waiting for user to start camera');
    }
  }, [isReady, isChannelReady]);

  // Send landmarks to desktop when they update - optimized for reduced lag
  useEffect(() => {
    if (!landmarks || !channelRef.current || landmarks.length === 0 || !isTracking) return;

    // Throttle to ~20fps to reduce network load and lag
    const timeoutId = setTimeout(() => {
      channelRef.current.send({
        type: 'broadcast',
        event: 'landmarks',
        payload: {
          landmarks, // Send full landmarks but less frequently
          handedness,
          timestamp: Date.now(),
        }
      }).catch((error: Error) => {
        console.error('Error sending landmarks:', error);
      });
    }, 50); // ~20fps instead of 30fps for lighter streaming

    return () => clearTimeout(timeoutId);
  }, [landmarks, handedness, isTracking]);

  const handleStartTracking = async () => {
    setCameraError(null);
    setLoadingStatus('camera-loading');
    
    try {
      addDebugLog('User tapped start - checking system readiness');
      
      // Ensure video element exists
      if (!videoRef.current) {
        throw new Error('Video element not initialized');
      }
      
      // Ensure MediaPipe is ready
      if (!isReady) {
        throw new Error('MediaPipe not ready - please wait a moment and try again');
      }
      
      // Send "started" event to desktop immediately
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tracking-started',
          payload: {
            timestamp: Date.now(),
          }
        }).catch((error: Error) => {
          console.error('Error sending start event:', error);
        });
        addDebugLog('Sent tracking-started event to desktop');
      }
      
      addDebugLog('Requesting camera access...');
      await startCamera();
      setIsTracking(true);
      setLoadingStatus('ready'); // Remove loader after camera starts
      addDebugLog('Camera started successfully');
      
      toast({
        title: "Tracking Started",
        description: "Hand tracking is active",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start camera:', error);
      addDebugLog(`Camera error: ${errorMsg}`);
      setCameraError(errorMsg);
      setLoadingStatus('error');
      
      toast({
        title: "Camera Error",
        description: errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')
          ? "Please allow camera access in your browser"
          : errorMsg.includes('NotFoundError')
          ? "No camera found on your device"
          : errorMsg.includes('not ready')
          ? "System still loading - please try again"
          : "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Always render video element so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        
        {loadingStatus === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium text-foreground">
              Loading...
            </p>
          </div>
        )}

        {loadingStatus === 'ready' && !isTracking && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <button
              onClick={handleStartTracking}
              disabled={!isReady}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start
            </button>
            {!isReady && (
              <p className="text-sm text-muted-foreground">
                Initializing system...
              </p>
            )}
          </div>
        )}

        {loadingStatus === 'camera-loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium text-foreground">
              Starting camera...
            </p>
            <p className="text-sm text-muted-foreground">
              Please allow camera access
            </p>
          </div>
        )}
        
        {loadingStatus === 'ready' && isTracking && (
          <div className="flex-1 flex flex-col w-full h-full">
            {/* Full-screen hand skeleton visualization */}
            <div className="relative w-full h-full bg-background">
              <svg 
                viewBox="0 0 640 480" 
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                style={{ transform: 'scaleX(-1)' }} // Mirror for natural movement
              >
                {landmarks && landmarks.map((hand: any, handIndex: number) => (
                  <g key={handIndex}>
                    {/* Draw connections between landmarks */}
                    {[
                      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                      [0, 5], [5, 6], [6, 7], [7, 8], // Index
                      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
                      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
                      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
                    ].map(([start, end], idx) => (
                      <line
                        key={idx}
                        x1={hand[start].x * 640}
                        y1={hand[start].y * 480}
                        x2={hand[end].x * 640}
                        y2={hand[end].y * 480}
                        stroke="hsl(var(--primary))"
                        strokeWidth="1.5"
                        opacity="0.7"
                      />
                    ))}
                    {/* Draw landmark points */}
                    {hand.map((landmark: any, idx: number) => (
                      <circle
                        key={idx}
                        cx={landmark.x * 640}
                        cy={landmark.y * 480}
                        r={idx === 0 || idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20 ? 4 : 2.5}
                        fill="hsl(var(--primary))"
                        opacity="0.8"
                      />
                    ))}
                  </g>
                ))}
              </svg>
            </div>
            
            {/* Status indicator overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Tracking Active • {landmarks?.length || 0} hand{landmarks?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {loadingStatus === 'error' && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="p-6 bg-destructive/10 border border-destructive rounded-lg max-w-md w-full space-y-4">
              <p className="text-lg font-semibold text-destructive text-center">
                Camera Error
              </p>
              {cameraError && (
                <p className="text-sm text-muted-foreground text-center">
                  {cameraError.includes('Permission') || cameraError.includes('NotAllowedError')
                    ? "Camera permission denied. Please enable camera access in your browser settings and try again."
                    : cameraError.includes('NotFoundError')
                    ? "No camera found on your device."
                    : "Failed to start camera. Please try again."}
                </p>
              )}
              <button
                onClick={() => {
                  setCameraError(null);
                  setLoadingStatus('ready');
                }}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCamera;
