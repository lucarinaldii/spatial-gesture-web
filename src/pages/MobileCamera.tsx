import { WebcamStream } from '@/components/WebcamStream';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebRTCConnection } from '@/utils/webrtc';
import { useToast } from '@/hooks/use-toast';

const MobileCamera = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session');
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');
  const { toast } = useToast();

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
        toast({
          title: "Connection Error",
          description: "Could not connect to streaming service",
          variant: "destructive",
        });
      } else {
        console.log('Mobile: Anonymous auth successful');
      }
    };

    setupConnection();

    return () => {
      webrtcRef.current?.disconnect();
    };
  }, [sessionId, navigate, toast]);

  const handleStream = async (stream: MediaStream) => {
    console.log('Mobile camera stream received, setting up WebRTC');
    
    if (webrtcRef.current) {
      console.log('WebRTC already initialized, skipping');
      return;
    }
    
    try {
      // Notify desktop that mobile is ready
      const channel = supabase.channel(`camera-${sessionId}`, {
        config: {
          broadcast: { self: true },
        },
      });
      await channel.subscribe((status) => {
        console.log('Mobile signaling channel status:', status);
      });
      console.log('Mobile: Sending mobile-ready signal');
      await channel.send({
        type: 'broadcast',
        event: 'mobile-ready',
        payload: { ready: true }
      });
      
      webrtcRef.current = new WebRTCConnection(
        sessionId!,
        undefined,
        (state) => {
          console.log('Mobile WebRTC state changed:', state);
          setConnectionState(state);
        }
      );
      
      await webrtcRef.current.initializeAsOfferer(stream);
      console.log('Mobile: WebRTC initialized successfully');
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      toast({
        title: "Streaming Error",
        description: "Could not start video streaming",
        variant: "destructive",
      });
    }
  };

  const handleStreamEnd = () => {
    console.log('Stream ended');
    webrtcRef.current?.disconnect();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-center">
        <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">
            Status: {connectionState === 'connected' ? '🟢 Connected' : connectionState === 'connecting' ? '🟡 Connecting...' : '⚪ Waiting'}
          </p>
        </div>
      </div>
      <WebcamStream onStream={handleStream} onStreamEnd={handleStreamEnd} />
      <p className="mt-4 text-sm text-muted-foreground max-w-md text-center">
        Keep this page open and position your hands in front of the camera. The desktop will track your hand gestures.
      </p>
    </div>
  );
};

export default MobileCamera;
