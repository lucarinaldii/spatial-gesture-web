import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WebcamStreamProps {
  onStream: (stream: MediaStream) => void;
  onStreamEnd: () => void;
}

export const WebcamStream = ({ onStream, onStreamEnd }: WebcamStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const startWebcam = async () => {
      try {
        console.log('Requesting webcam access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('Webcam stream obtained:', stream.id);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log('Video element playing');
        }

        onStream(stream);
        setIsStreaming(true);
        
        if (!hasNotified) {
          setHasNotified(true);
          toast({
            title: "Camera Ready",
            description: "Streaming to desktop for hand tracking",
          });
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        if (!hasNotified) {
          setHasNotified(true);
          toast({
            title: "Camera Error",
            description: "Could not access webcam. Please grant camera permissions.",
            variant: "destructive",
          });
        }
      }
    };

    startWebcam();

    return () => {
      mounted = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      onStreamEnd();
    };
  }, []); // Only run once on mount

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold text-foreground">Smartphone Camera</h2>
      <video
        ref={videoRef}
        className="w-full max-w-md rounded-lg border-2 border-primary shadow-lg"
        playsInline
        muted
      />
      {isStreaming && (
        <p className="text-muted-foreground">✓ Camera streaming to desktop</p>
      )}
    </div>
  );
};
