import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface CalibrationOverlayProps {
  onClose: () => void;
  cursorOffset: { x: number; y: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
}

export const CalibrationOverlay = ({ onClose, cursorOffset, onOffsetChange }: CalibrationOverlayProps) => {
  return (
    <div className="fixed top-8 left-8 z-[100] pointer-events-auto">
      <Card className="p-4 w-80 space-y-4 bg-background/95 backdrop-blur-sm shadow-xl border-2 border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Cursor Calibration</h3>
            <p className="text-xs text-muted-foreground">
              Pinch and adjust until cursor matches your finger
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Offset controls */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">X Offset</label>
              <span className="text-xs text-muted-foreground tabular-nums">{cursorOffset.x}px</span>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Y Offset</label>
              <span className="text-xs text-muted-foreground tabular-nums">{cursorOffset.y}px</span>
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
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onOffsetChange({ x: 0, y: 0 })}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
