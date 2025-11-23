import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface GasStationModeProps {
  handPositions: any;
  gestureStates: any;
  onBack: () => void;
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

export const GasStationMode = ({ handPositions, gestureStates, onBack }: GasStationModeProps) => {
  const [selectedPump, setSelectedPump] = useState<number | null>(null);
  const [wantsReceipt, setWantsReceipt] = useState<boolean | null>(null);
  const [step, setStep] = useState<'pump' | 'receipt' | 'confirmation'>('pump');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const isPinchScrollingRef = useRef(false);
  const pinchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Pinch gesture for scrolling
  useEffect(() => {
    if (!handPositions?.Right || !gestureStates?.Right || !scrollContainerRef.current) return;

    const rightHand = handPositions.Right;
    const rightGesture = gestureStates.Right;
    const container = scrollContainerRef.current;

    if (rightGesture === 'Closed_Fist') {
      if (!isPinchScrollingRef.current) {
        isPinchScrollingRef.current = true;
        pinchStartPosRef.current = { x: rightHand.x, y: rightHand.y };
        lastPinchDistanceRef.current = rightHand.y;
      } else if (pinchStartPosRef.current && lastPinchDistanceRef.current !== null) {
        const deltaY = pinchStartPosRef.current.y - rightHand.y;
        
        if (Math.abs(deltaY) > 0.02) {
          const scrollDelta = deltaY * window.innerHeight * 1.2;
          container.scrollTop += scrollDelta;
          pinchStartPosRef.current = { x: rightHand.x, y: rightHand.y };
        }
      }
    } else {
      isPinchScrollingRef.current = false;
      pinchStartPosRef.current = null;
      lastPinchDistanceRef.current = null;
    }
  }, [handPositions, gestureStates]);

  const handlePumpSelect = (pumpId: number) => {
    setSelectedPump(pumpId);
    setTimeout(() => setStep('receipt'), 300);
  };

  const handleReceiptChoice = (choice: boolean) => {
    setWantsReceipt(choice);
    setTimeout(() => setStep('confirmation'), 300);
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
                    className={`p-8 cursor-pointer transition-all hover:scale-105 ${
                      !pump.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedPump === pump.id ? 'ring-4 ring-primary' : ''}`}
                    onClick={() => pump.available && handlePumpSelect(pump.id)}
                  >
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
                  className={`p-12 cursor-pointer transition-all hover:scale-105 ${
                    wantsReceipt === true ? 'ring-4 ring-primary' : ''
                  }`}
                  onClick={() => handleReceiptChoice(true)}
                >
                  <div className="text-center space-y-6">
                    <Check className="h-20 w-20 mx-auto text-primary" />
                    <div className="text-2xl font-semibold">Yes, Please</div>
                  </div>
                </Card>
                <Card
                  className={`p-12 cursor-pointer transition-all hover:scale-105 ${
                    wantsReceipt === false ? 'ring-4 ring-primary' : ''
                  }`}
                  onClick={() => handleReceiptChoice(false)}
                >
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
                <Button size="lg" onClick={() => { setStep('pump'); setSelectedPump(null); setWantsReceipt(null); }}>
                  Start Over
                </Button>
                <Button size="lg" variant="outline" onClick={onBack}>
                  Exit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
