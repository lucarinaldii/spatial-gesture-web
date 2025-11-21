import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface CalibrationOverlayProps {
  onClose: () => void;
  cursorOffset: { x: number; y: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
}

export const CalibrationOverlay = ({ onClose, cursorOffset, onOffsetChange }: CalibrationOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="p-6 max-w-md w-full mx-4 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Cursor Calibration</h2>
          <p className="text-sm text-muted-foreground">
            Touch the target with your index finger tip, then adjust the offsets until the cursor aligns perfectly.
          </p>
        </div>

        {/* Calibration target */}
        <div className="relative w-full h-48 bg-muted/20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Outer rings */}
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/40 animate-pulse" />
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/30" style={{ transform: 'scale(1.3)' }} />
              
              {/* Center target */}
              <div className="relative w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            </div>
          </div>
          
          <p className="absolute bottom-4 text-xs text-muted-foreground">
            Touch this target with your index finger tip
          </p>
        </div>

        {/* Offset controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">X Offset</label>
              <span className="text-sm text-muted-foreground">{cursorOffset.x}px</span>
            </div>
            <Slider
              value={[cursorOffset.x]}
              onValueChange={(values) => onOffsetChange({ ...cursorOffset, x: values[0] })}
              min={-200}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Y Offset</label>
              <span className="text-sm text-muted-foreground">{cursorOffset.y}px</span>
            </div>
            <Slider
              value={[cursorOffset.y]}
              onValueChange={(values) => onOffsetChange({ ...cursorOffset, y: values[0] })}
              min={-200}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onOffsetChange({ x: 0, y: 0 })}
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
