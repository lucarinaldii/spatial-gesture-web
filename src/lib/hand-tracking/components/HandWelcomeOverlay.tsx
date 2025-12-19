import { useEffect, useState } from 'react';

export interface HandWelcomeOverlayProps {
  onDismiss: () => void;
  autoDismissOnHand?: boolean;
  hasHandDetected?: boolean;
  title?: string;
  subtitle?: string;
  dismissHint?: string;
  autoDismissTimeout?: number;
  className?: string;
}

export const HandWelcomeOverlay = ({
  onDismiss,
  autoDismissOnHand = true,
  hasHandDetected = false,
  title = 'Show your hand',
  subtitle = 'Position your hand in front of the camera to start',
  dismissHint = 'Tap anywhere to dismiss',
  autoDismissTimeout = 8000,
  className = '',
}: HandWelcomeOverlayProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismissOnHand && hasHandDetected) {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }
  }, [hasHandDetected, autoDismissOnHand, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, autoDismissTimeout);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissTimeout]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${className}`}
      onClick={handleDismiss}
    >
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      />
      
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        <div className="relative w-48 h-48">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
          >
            <g 
              fill="currentColor" 
              opacity="0.8"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              <ellipse cx="50" cy="60" rx="18" ry="22" />
              <ellipse cx="28" cy="52" rx="5" ry="12" transform="rotate(-30 28 52)" />
              <rect x="36" y="20" width="6" height="28" rx="3" />
              <rect x="47" y="15" width="6" height="32" rx="3" />
              <rect x="58" y="20" width="6" height="28" rx="3" />
              <rect x="68" y="28" width="5" height="22" rx="2.5" />
            </g>
            
            <g stroke="currentColor" strokeWidth="1.5" opacity="0.4" fill="none">
              <path d="M 15 40 Q 10 50 15 60" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              <path d="M 10 45 Q 5 50 10 55" style={{ animation: 'pulse 2s ease-in-out infinite 0.3s' }} />
              <path d="M 85 40 Q 90 50 85 60" style={{ animation: 'pulse 2s ease-in-out infinite 0.6s' }} />
              <path d="M 90 45 Q 95 50 90 55" style={{ animation: 'pulse 2s ease-in-out infinite 0.9s' }} />
            </g>
          </svg>
        </div>
        
        <div className="space-y-3">
          <h2 
            className="text-3xl font-bold"
            style={{ color: 'white', animation: 'fadeIn 0.3s ease-out' }}
          >
            {title}
          </h2>
          <p 
            className="text-lg"
            style={{ color: 'rgba(255, 255, 255, 0.7)', animation: 'fadeIn 0.3s ease-out' }}
          >
            {subtitle}
          </p>
        </div>
        
        <p 
          className="text-sm"
          style={{ color: 'rgba(255, 255, 255, 0.5)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        >
          {dismissHint}
        </p>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
