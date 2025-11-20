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

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        onStream(stream);
        setIsStreaming(true);
        
        toast({
          title: "Camera Connected",
          description: "Webcam stream is ready for hand tracking",
        });
      } catch (error) {
        console.error('Error accessing webcam:', error);
        toast({
          title: "Camera Error",
          description: "Could not access webcam. Please grant camera permissions.",
          variant: "destructive",
        });
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      onStreamEnd();
    };
  }, [onStream, onStreamEnd, toast]);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold text-foreground">Smartphone Camera</h2>
      <video
        ref={videoRef}
        className="w-full max-w-md rounded-lg border-2 border-primary"
        playsInline
        muted
      />
      {isStreaming && (
        <p className="text-muted-foreground">Camera is streaming for hand tracking</p>
      )}
    </div>
  );
};
