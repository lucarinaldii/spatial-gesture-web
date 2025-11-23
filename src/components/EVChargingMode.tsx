import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft, Zap } from 'lucide-react';

interface EVChargingModeProps {
  handPositions: any;
  gestureStates: any;
  onBack: () => void;
}

const CHARGING_COLUMNS = [
  { id: 1, name: 'Column A', power: '50kW', available: true },
  { id: 2, name: 'Column B', power: '50kW', available: true },
  { id: 3, name: 'Column C', power: '150kW', available: false },
  { id: 4, name: 'Column D', power: '150kW', available: true },
  { id: 5, name: 'Column E', power: '350kW', available: true },
  { id: 6, name: 'Column F', power: '350kW', available: true },
];

const CONNECTORS = [
  { id: 'ccs', name: 'CCS (Combined Charging System)', icon: '🔌' },
  { id: 'chademo', name: 'CHAdeMO', icon: '⚡' },
  { id: 'type2', name: 'Type 2 (Mennekes)', icon: '🔋' },
  { id: 'tesla', name: 'Tesla Supercharger', icon: '⚡' },
];

export const EVChargingMode = ({ handPositions, gestureStates, onBack }: EVChargingModeProps) => {
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [step, setStep] = useState<'column' | 'connector' | 'confirmation'>('column');
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

  const handleColumnSelect = (columnId: number) => {
    setSelectedColumn(columnId);
    setTimeout(() => setStep('connector'), 300);
  };

  const handleConnectorSelect = (connectorId: string) => {
    setSelectedConnector(connectorId);
    setTimeout(() => setStep('confirmation'), 300);
  };

  const selectedColumnData = CHARGING_COLUMNS.find(c => c.id === selectedColumn);
  const selectedConnectorData = CONNECTORS.find(c => c.id === selectedConnector);

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8" />
          EV Charging
        </h1>
        <div className="w-24" />
      </div>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-6xl mx-auto p-8">
          {step === 'column' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center mb-8">Select Charging Column</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CHARGING_COLUMNS.map((column) => (
                  <Card
                    key={column.id}
                    className={`p-8 cursor-pointer transition-all hover:scale-105 ${
                      !column.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedColumn === column.id ? 'ring-4 ring-primary' : ''}`}
                    onClick={() => column.available && handleColumnSelect(column.id)}
                  >
                    <div className="text-center space-y-4">
                      <Zap className="h-12 w-12 mx-auto text-primary" />
                      <div className="text-2xl font-bold">{column.name}</div>
                      <div className="text-lg text-primary font-semibold">{column.power}</div>
                      {!column.available ? (
                        <div className="text-sm text-destructive font-medium">In Use</div>
                      ) : (
                        <div className="text-sm text-green-500 font-medium">Available</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'connector' && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-12">Select Connector Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CONNECTORS.map((connector) => (
                  <Card
                    key={connector.id}
                    className={`p-8 cursor-pointer transition-all hover:scale-105 ${
                      selectedConnector === connector.id ? 'ring-4 ring-primary' : ''
                    }`}
                    onClick={() => handleConnectorSelect(connector.id)}
                  >
                    <div className="text-center space-y-4">
                      <div className="text-6xl">{connector.icon}</div>
                      <div className="text-xl font-semibold">{connector.name}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="space-y-8 max-w-2xl mx-auto text-center">
              <div className="bg-primary/10 rounded-full w-32 h-32 mx-auto flex items-center justify-center">
                <Zap className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Ready to Charge!</h2>
              <div className="space-y-4 text-xl">
                <p>Column: <span className="font-bold text-primary">{selectedColumnData?.name}</span></p>
                <p>Power: <span className="font-bold">{selectedColumnData?.power}</span></p>
                <p>Connector: <span className="font-bold">{selectedConnectorData?.name}</span></p>
              </div>
              <p className="text-muted-foreground text-lg">Please connect your vehicle to begin charging.</p>
              <div className="flex gap-4 justify-center pt-8">
                <Button size="lg" onClick={() => { 
                  setStep('column'); 
                  setSelectedColumn(null); 
                  setSelectedConnector(null); 
                }}>
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
