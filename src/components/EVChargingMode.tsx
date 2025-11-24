import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft, Zap } from 'lucide-react';

interface EVChargingModeProps {
  handPositions: any;
  gestureStates: any;
  onBack: () => void;
  showCursor?: boolean;
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

export const EVChargingMode = ({ handPositions, gestureStates, onBack, showCursor = true }: EVChargingModeProps) => {
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [step, setStep] = useState<'column' | 'connector' | 'confirmation'>('column');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [scrollLine, setScrollLine] = useState<{ startY: number; currentY: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [loadingColumn, setLoadingColumn] = useState<number | null>(null);
  const [loadingConnector, setLoadingConnector] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchStateRef = useRef<boolean>(false);

  // Pinch gesture for scrolling and clicking
  useEffect(() => {
    if (!handPositions || handPositions.length === 0 || !gestureStates || gestureStates.length === 0) return;

    // Find any hand that's pinching (check both hands)
    let hand = null;
    let gesture = null;
    for (let i = 0; i < Math.min(handPositions.length, gestureStates.length); i++) {
      if (gestureStates[i]?.isPinching) {
        hand = handPositions[i];
        gesture = gestureStates[i];
        break;
      }
    }
    
    // If no hand is pinching, use first hand for position tracking
    if (!hand && handPositions.length > 0) {
      hand = handPositions[0];
      gesture = gestureStates[0];
    }
    
    const isPinching = gesture?.isPinching || false;
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

  // Detect hover - check all elements at point (use any hand position)
  useEffect(() => {
    if (!handPositions || handPositions.length === 0) {
      setHoveredElement(null);
      return;
    }

    // Use the first available hand for hover detection
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

  const handleColumnSelect = (columnId: number) => {
    setLoadingColumn(columnId);
    setSelectedColumn(columnId);
    setLoadingColumn(null);
    setStep('connector');
  };

  const handleConnectorSelect = (connectorId: string) => {
    setLoadingConnector(connectorId);
    setSelectedConnector(connectorId);
    setLoadingConnector(null);
    setStep('confirmation');
  };

  const selectedColumnData = CHARGING_COLUMNS.find(c => c.id === selectedColumn);
  const selectedConnectorData = CONNECTORS.find(c => c.id === selectedConnector);

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <Button variant="ghost" onClick={onBack} className="gap-3 h-16 px-6 text-lg" size="lg">
          <ChevronLeft className="h-6 w-6" />
          Back
        </Button>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Zap className="h-10 w-10" />
          EV Charging
        </h1>
        <div className="w-32" />
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
                    data-clickable
                    data-id={`column-${column.id}`}
                    className={`p-6 cursor-pointer transition-all relative ${
                      !column.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedColumn === column.id ? 'ring-4 ring-primary' : ''} ${
                      hoveredElement === `column-${column.id}` && column.available ? 'ring-2 ring-primary/50 scale-105' : ''
                    }`}
                    onClick={() => column.available && !loadingColumn && handleColumnSelect(column.id)}
                  >
                    {loadingColumn === column.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="text-center space-y-3">
                      <Zap className="h-14 w-14 mx-auto text-primary" />
                      <div className="text-2xl font-bold">{column.name}</div>
                      <div className="text-xl text-primary font-semibold">{column.power}</div>
                      {!column.available ? (
                        <div className="text-base text-destructive font-medium">In Use</div>
                      ) : (
                        <div className="text-base text-green-500 font-medium">Available</div>
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
                    data-clickable
                    data-id={`connector-${connector.id}`}
                    className={`p-6 cursor-pointer transition-all relative ${
                      selectedConnector === connector.id ? 'ring-4 ring-primary' : ''
                    } ${hoveredElement === `connector-${connector.id}` ? 'ring-2 ring-primary/50 scale-105' : ''}`}
                    onClick={() => !loadingConnector && handleConnectorSelect(connector.id)}
                  >
                    {loadingConnector === connector.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="text-center space-y-3">
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
              <div className="flex gap-6 justify-center pt-8">
                <Button 
                  size="lg" 
                  data-clickable
                  data-id="start-over"
                  className={`h-16 px-8 text-lg ${hoveredElement === 'start-over' ? 'ring-2 ring-primary/50' : ''}`}
                  onClick={() => { 
                    setStep('column'); 
                    setSelectedColumn(null); 
                    setSelectedConnector(null); 
                  }}
                >
                  Start Over
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  data-clickable
                  data-id="exit"
                  className={`h-16 px-8 text-lg ${hoveredElement === 'exit' ? 'ring-2 ring-primary/50' : ''}`}
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
          className="fixed rounded-full pointer-events-none z-[60] will-change-transform"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${handPositions[0].x * window.innerWidth}px, ${handPositions[0].y * window.innerHeight}px) translate(-50%, -50%) scale(${gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? 1.33 : 1})`,
            width: '24px',
            height: '24px',
            backgroundColor: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? 'hsl(var(--primary) / 0.8)' : 'hsl(var(--primary) / 0.5)',
            border: '3px solid hsl(var(--primary))',
            boxShadow: gestureStates && gestureStates.length > 0 && gestureStates[0].isPinching ? '0 0 20px hsl(var(--primary))' : 'none',
          }}
        />
      )}
    </div>
  );
};
