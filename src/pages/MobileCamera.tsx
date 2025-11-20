import { WebcamStream } from '@/components/WebcamStream';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MobileCamera = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session');
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Set up realtime channel for WebRTC signaling
    const channel = supabase.channel(`camera-${sessionId}`);
    channelRef.current = channel;

    channel.subscribe((status) => {
      console.log('Channel status:', status);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, navigate]);

  const handleStream = async (stream: MediaStream) => {
    // Here we would set up WebRTC peer connection
    // For now, we'll just acknowledge the stream
    console.log('Stream received:', stream);
    
    // Send stream info through channel
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'stream-ready',
        payload: { sessionId }
      });
    }
  };

  const handleStreamEnd = () => {
    console.log('Stream ended');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <WebcamStream onStream={handleStream} onStreamEnd={handleStreamEnd} />
    </div>
  );
};

export default MobileCamera;
