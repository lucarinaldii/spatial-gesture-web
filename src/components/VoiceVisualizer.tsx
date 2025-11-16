import { useEffect, useRef, useState } from 'react';
import { Mic, Check, X } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  commandRecognized: boolean;
  commandSuccess?: boolean;
  commandError?: boolean;
}

export const VoiceVisualizer = ({ 
  isListening, 
  commandRecognized,
  commandSuccess = false,
  commandError = false 
}: VoiceVisualizerProps) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (commandRecognized) {
      setIsProcessing(true);
      const timer = setTimeout(() => setIsProcessing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [commandRecognized]);

  useEffect(() => {
    if (!isListening) {
      // Clean up audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
      return;
    }

    // Set up audio visualization
    const setupAudioVisualization = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateLevel = () => {
          if (!analyserRef.current || !isListening) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, average / 255 * 100));
          
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (error) {
        console.error('Error setting up audio visualization:', error);
      }
    };

    setupAudioVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening]);

  if (!isListening) return null;

  const getStateColor = () => {
    if (commandError) return 'from-destructive/60 via-destructive/40 to-destructive/20';
    if (commandSuccess || isProcessing) return 'from-primary/60 via-primary/40 to-primary/20';
    return 'from-accent/60 via-secondary/40 to-accent/20';
  };

  const getIconColor = () => {
    if (commandError) return 'text-destructive';
    if (commandSuccess || isProcessing) return 'text-primary';
    return 'text-accent';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="relative h-16 overflow-hidden">
        {/* Gradient background */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t ${getStateColor()} transition-all duration-300`}
          style={{
            opacity: isListening ? 0.8 : 0,
            transform: `scaleY(${0.3 + (audioLevel / 100) * 0.7})`,
            transformOrigin: 'bottom',
          }}
        />
        
        {/* Animated bars */}
        <div className="absolute inset-0 flex items-end justify-center gap-1 pb-4">
          {[...Array(20)].map((_, i) => {
            const delay = i * 0.05;
            const height = Math.max(10, audioLevel * (0.5 + Math.random() * 0.5));
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  commandError ? 'bg-destructive' : 
                  (commandSuccess || isProcessing) ? 'bg-primary' : 
                  'bg-accent'
                }`}
                style={{
                  height: `${height}%`,
                  opacity: audioLevel > 5 ? 0.6 : 0.3,
                  transitionDelay: `${delay}s`,
                  animation: audioLevel > 5 ? 'pulse 1s ease-in-out infinite' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Status icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300 ${
            commandRecognized ? 'scale-110' : 'scale-100'
          }`}>
            {commandError ? (
              <X className={`w-5 h-5 ${getIconColor()}`} />
            ) : commandSuccess || isProcessing ? (
              <Check className={`w-5 h-5 ${getIconColor()} animate-in zoom-in`} />
            ) : (
              <Mic className={`w-5 h-5 ${getIconColor()} ${audioLevel > 20 ? 'animate-pulse' : ''}`} />
            )}
          </div>
        </div>

        {/* Text feedback */}
        {(commandSuccess || commandError || isProcessing) && (
          <div className="absolute inset-x-0 top-2 flex justify-center">
            <div className="px-4 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
              {commandError ? (
                <span className="text-destructive">Command failed</span>
              ) : commandSuccess ? (
                <span className="text-primary">Command executed!</span>
              ) : (
                <span className="text-muted-foreground">Processing...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
