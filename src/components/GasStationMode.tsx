import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft } from 'lucide-react';

interface GasStationModeProps {
  handPositions: any;
  gestureStates: any;
  onBack: () => void;
  showCursor?: boolean;
}

const PUMPS = [
  { id: 1, name: 'Pump 1', available: true },
  { id: 2, name: 'Pump 2', available: true },
  { id: 3, name: 'Pump 3', available: false },
  { id: 4, name: 'Pump 4', available: true },
  { id: 5, name: 'Pump 5', available: true },
  { id: 6, name: 'Pump 6', available: true },
  { id: 7, name: 'Pump 7', available: true },
  { id: 8, name: 'Pump 8', available: false },
];

export const GasStationMode = ({ handPositions, gestureStates, onBack, showCursor = true }: GasStationModeProps) => {
  const [selectedPump, setSelectedPump] = useState<number | null>(null);
  const [wantsReceipt, setWantsReceipt] = useState<boolean | null>(null);
  const [step, setStep] = useState<'pump' | 'receipt' | 'confirmation'>('pump');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [scrollLine, setScrollLine] = useState<{ startY: number; currentY: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [loadingPump, setLoadingPump] = useState<number | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<boolean | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchStateRef = useRef<boolean>(false);

  // Pinch gesture for scrolling and clicking
  useEffect(() => {
    if (!handPositions || handPositions.length === 0 || !gestureStates || gestureStates.length === 0) return;

    const hand = handPositions[0];
    const gesture = gestureStates[0];
    const isPinching = gesture.isPinching;
    const wasPinching = lastPinchStateRef.current;

    if (isPinching && !wasPinching) {
      // Pinch started - store position
      pinchStartPositionRef.current = { x: hand.x, y: hand.y };
      setScrollLine({ startY: hand.y * window.innerHeight, currentY: hand.y * window.innerHeight });
      setIsScrolling(false);
    } else if (isPinching && wasPinching && pinchStartPositionRef.current) {
      // Pinch + move = scroll
      const deltaY = (hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
      
      // Update scroll line
      setScrollLine({ 
        startY: pinchStartPositionRef.current.y * window.innerHeight, 
        currentY: hand.y * window.innerHeight 
      });
      
      // Scroll threshold - only scroll if moved more than 20px
      if (Math.abs(deltaY) > 20 && scrollContainerRef.current) {
        // Direct scroll for responsive feel
        const currentScroll = scrollContainerRef.current.scrollTop;
        const scrollDelta = deltaY * 1.2;
        scrollContainerRef.current.scrollTop = currentScroll - scrollDelta;
        
        pinchStartPositionRef.current = { x: hand.x, y: hand.y };
        setIsScrolling(true);
      }
    } else if (!isPinching && wasPinching && pinchStartPositionRef.current) {
      // Pinch released - clear scroll line
      setScrollLine(null);
      
      // Pinch released - check if it was a click (no significant movement)
      const deltaX = Math.abs(hand.x - pinchStartPositionRef.current.x) * window.innerWidth;
      const deltaY = Math.abs(hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
      
      // Only trigger click if no scrolling occurred and movement under 40px
      if (!isScrolling && deltaX < 40 && deltaY < 40) {
        // Use the pinch START position for click detection
        const x = pinchStartPositionRef.current.x * window.innerWidth;
        const y = pinchStartPositionRef.current.y * window.innerHeight;
        
        // Get all elements at point and find the clickable one
        const elements = document.elementsFromPoint(x, y);
        
        let clickableElement: HTMLElement | null = null;
        for (const el of elements) {
          if (el instanceof HTMLElement) {
            const clickable = el.closest('button, [data-clickable], a');
            if (clickable instanceof HTMLElement) {
              clickableElement = clickable;
              break;
            }
          }
        }
        
        if (clickableElement) {
          clickableElement.click();
        }
      }
      
      pinchStartPositionRef.current = null;
      // Reset scrolling flag after a short delay
      setTimeout(() => setIsScrolling(false), 100);
    }

    lastPinchStateRef.current = isPinching;
  }, [handPositions, gestureStates]);

  // Detect hover - check all elements at point
  useEffect(() => {
    if (!handPositions || handPositions.length === 0) {
      setHoveredElement(null);
      return;
    }

    const hand = handPositions[0];
    const x = hand.x * window.innerWidth;
    const y = hand.y * window.innerHeight;

    // Get all elements at this point to find the interactive one
    const elements = document.elementsFromPoint(x, y);
    let foundId: string | null = null;
    
    for (const element of elements) {
      if (element instanceof HTMLElement) {
        // Check if it's a clickable element
        const clickable = element.closest('button, [data-clickable]');
        if (clickable instanceof HTMLElement) {
          foundId = clickable.id || clickable.getAttribute('data-id') || null;
          break;
        }
      }
    }

    setHoveredElement(foundId);
  }, [handPositions]);

  const handlePumpSelect = (pumpId: number) => {
    setLoadingPump(pumpId);
    setSelectedPump(pumpId);
    setLoadingPump(null);
    setStep('receipt');
  };

  const handleReceiptChoice = (choice: boolean) => {
    setLoadingReceipt(choice);
    setWantsReceipt(choice);
    setLoadingReceipt(null);
    setStep('confirmation');
  };

  const handleConfirm = () => {
    // Handle confirmation logic here
    console.log('Pump:', selectedPump, 'Receipt:', wantsReceipt);
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Gas Station</h1>
        <div className="w-24" />
      </div>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-6xl mx-auto p-8">
          {step === 'pump' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center mb-8">Select Your Pump</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {PUMPS.map((pump) => (
                  <Card
                    key={pump.id}
                    data-clickable
                    data-id={`pump-${pump.id}`}
                    className={`p-8 cursor-pointer transition-all relative ${
                      !pump.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedPump === pump.id ? 'ring-4 ring-primary' : ''} ${
                      hoveredElement === `pump-${pump.id}` && pump.available ? 'ring-2 ring-primary/50 scale-105' : ''
                    }`}
                    onClick={() => pump.available && !loadingPump && handlePumpSelect(pump.id)}
                  >
                    {loadingPump === pump.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="text-center space-y-4">
                      <div className="text-6xl font-bold text-primary">{pump.id}</div>
                      <div className="text-lg">{pump.name}</div>
                      {!pump.available && (
                        <div className="text-sm text-destructive">Unavailable</div>
                      )}
                      {pump.available && (
                        <div className="text-sm text-muted-foreground">Available</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'receipt' && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-12">Would you like a receipt?</h2>
              <div className="grid grid-cols-2 gap-8">
                <Card
                  data-clickable
                  data-id="receipt-yes"
                  className={`p-12 cursor-pointer transition-all relative ${
                    wantsReceipt === true ? 'ring-4 ring-primary' : ''
                  } ${hoveredElement === 'receipt-yes' ? 'ring-2 ring-primary/50 scale-105' : ''}`}
                  onClick={() => !loadingReceipt && handleReceiptChoice(true)}
                >
                  {loadingReceipt === true && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="text-center space-y-6">
                    <Check className="h-20 w-20 mx-auto text-primary" />
                    <div className="text-2xl font-semibold">Yes, Please</div>
                  </div>
                </Card>
                <Card
                  data-clickable
                  data-id="receipt-no"
                  className={`p-12 cursor-pointer transition-all relative ${
                    wantsReceipt === false ? 'ring-4 ring-primary' : ''
                  } ${hoveredElement === 'receipt-no' ? 'ring-2 ring-primary/50 scale-105' : ''}`}
                  onClick={() => !loadingReceipt && handleReceiptChoice(false)}
                >
                  {loadingReceipt === false && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="text-center space-y-6">
                    <div className="h-20 w-20 mx-auto flex items-center justify-center text-6xl">✕</div>
                    <div className="text-2xl font-semibold">No, Thanks</div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="space-y-8 max-w-2xl mx-auto text-center">
              <div className="bg-primary/10 rounded-full w-32 h-32 mx-auto flex items-center justify-center">
                <Check className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">All Set!</h2>
              <div className="space-y-4 text-xl">
                <p>Pump <span className="font-bold text-primary">{selectedPump}</span></p>
                <p>Receipt: <span className="font-bold">{wantsReceipt ? 'Yes' : 'No'}</span></p>
              </div>
              <p className="text-muted-foreground text-lg">You can now start fueling at your selected pump.</p>
              <div className="flex gap-4 justify-center pt-8">
                <Button 
                  size="lg" 
                  data-clickable
                  data-id="start-over"
                  className={hoveredElement === 'start-over' ? 'ring-2 ring-primary/50' : ''}
                  onClick={() => { setStep('pump'); setSelectedPump(null); setWantsReceipt(null); }}
                >
                  Start Over
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  data-clickable
                  data-id="exit"
                  className={hoveredElement === 'exit' ? 'ring-2 ring-primary/50' : ''}
                  onClick={onBack}
                >
                  Exit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hand cursor indicators */}
      {showCursor && handPositions && handPositions.length > 0 && (
        <div
          className="fixed rounded-full pointer-events-none z-[60] transition-all duration-150"
          style={{
            left: `${handPositions[0].x * 100}%`,
            top: `${handPositions[0].y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? '32px' : '24px',
            height: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? '32px' : '24px',
            backgroundColor: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? 'hsl(var(--primary) / 0.8)' : 'hsl(var(--primary) / 0.5)',
            border: '3px solid hsl(var(--primary))',
            boxShadow: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? '0 0 20px hsl(var(--primary))' : 'none',
          }}
        />
      )}
    </div>
  );
};
