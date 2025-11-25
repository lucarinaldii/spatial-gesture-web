import { useEffect, useState } from 'react';

interface HandWelcomeOverlayProps {
  onDismiss: () => void;
  autoDismissOnHand?: boolean;
  hasHandDetected?: boolean;
}

export const HandWelcomeOverlay = ({ onDismiss, autoDismissOnHand = true, hasHandDetected = false }: HandWelcomeOverlayProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto dismiss when hand is detected
  useEffect(() => {
    if (autoDismissOnHand && hasHandDetected) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasHandDetected, autoDismissOnHand, onDismiss]);

  // Auto dismiss after 8 seconds if no hand detected
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Animated hand silhouette */}
        <div className="relative w-48 h-48">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full animate-pulse"
          >
            {/* Hand silhouette */}
            <g className="animate-[float_3s_ease-in-out_infinite]" fill="hsl(var(--primary))" opacity="0.8">
              {/* Palm */}
              <ellipse cx="50" cy="60" rx="18" ry="22" />
              
              {/* Thumb */}
              <ellipse cx="28" cy="52" rx="5" ry="12" transform="rotate(-30 28 52)" />
              
              {/* Index finger */}
              <rect x="36" y="20" width="6" height="28" rx="3" />
              
              {/* Middle finger */}
              <rect x="47" y="15" width="6" height="32" rx="3" />
              
              {/* Ring finger */}
              <rect x="58" y="20" width="6" height="28" rx="3" />
              
              {/* Pinky finger */}
              <rect x="68" y="28" width="5" height="22" rx="2.5" />
            </g>
            
            {/* Motion lines */}
            <g stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" fill="none">
              <path d="M 15 40 Q 10 50 15 60" className="animate-[pulse_2s_ease-in-out_infinite]" />
              <path d="M 10 45 Q 5 50 10 55" className="animate-[pulse_2s_ease-in-out_infinite_0.3s]" />
              <path d="M 85 40 Q 90 50 85 60" className="animate-[pulse_2s_ease-in-out_infinite_0.6s]" />
              <path d="M 90 45 Q 95 50 90 55" className="animate-[pulse_2s_ease-in-out_infinite_0.9s]" />
            </g>
          </svg>
        </div>
        
        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground animate-fade-in">
            Show your hand
          </h2>
          <p className="text-muted-foreground text-lg animate-fade-in">
            Position your hand in front of the camera to start
          </p>
        </div>
        
        {/* Tap to dismiss hint */}
        <p className="text-sm text-muted-foreground/60 animate-pulse">
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
};