import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Monitor, Smartphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile'>('desktop');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-primary/50 rounded-3xl flex items-center justify-center shadow-2xl">
            <img src="/icon-512.png" alt="App Icon" className="w-24 h-24 rounded-2xl" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground">
            Install Spatial Gesture Control
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Control your desktop with AI-powered hand gestures. Install it on your device for the best experience.
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center space-y-4">
            <Check className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Already Installed!</h2>
            <p className="text-muted-foreground">
              The app is installed on your device. Launch it from your desktop or home screen.
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Open App
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Desktop Installation */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Desktop Installation</h2>
              </div>
              
              {deferredPrompt ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Click the button below to install the app on your computer. It will work offline and feel like a native app!
                  </p>
                  <Button onClick={handleInstall} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Install for {platform === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-muted-foreground">
                  <p className="font-medium text-foreground">Manual Installation:</p>
                  
                  {platform === 'desktop' && (
                    <>
                      <div>
                        <p className="font-semibold">Chrome / Edge / Brave:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Click the install icon (⊕) in the address bar</li>
                          <li>Or go to Menu → Install Spatial Gesture Control</li>
                        </ol>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Firefox:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Click the three dots menu</li>
                          <li>Select "Install" or "Add to Home Screen"</li>
                        </ol>
                      </div>
                    </>
                  )}

                  {platform === 'mobile' && (
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">iPhone / iPad (Safari):</p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Tap the Share button (□↑)</li>
                          <li>Scroll and tap "Add to Home Screen"</li>
                          <li>Tap "Add"</li>
                        </ol>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Android (Chrome):</p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Tap the three dots menu</li>
                          <li>Tap "Install app" or "Add to Home Screen"</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">What You Get:</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Works offline - use hand gestures without internet</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Desktop shortcut - quick access from your desktop</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Full screen experience - distraction-free interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Fast loading - instant startup time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Auto updates - always get the latest features</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Skip and Use in Browser
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
