import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface AlignmentParams {
  skeletonScale: number;
  skeletonXOffset: number;
  skeletonYOffset: number;
  skeletonZDepth: number;
  hand3DScale: number;
  hand3DXOffset: number;
  hand3DYOffset: number;
  hand3DZDepth: number;
}

interface AlignmentSettingsProps {
  params: AlignmentParams;
  onParamsChange: (params: AlignmentParams) => void;
}

export default function AlignmentSettings({ params, onParamsChange }: AlignmentSettingsProps) {
  const updateParam = (key: keyof AlignmentParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <Card className="glass-panel p-4 space-y-4 max-w-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Hand Alignment</h3>
      
      <div className="space-y-4">
        {/* Skeleton Hand Controls */}
        <div className="space-y-3 pb-3 border-b border-border/30">
          <h4 className="text-sm font-semibold text-foreground">Skeleton Hand</h4>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Scale</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.skeletonScale.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.skeletonScale]}
              onValueChange={([v]) => updateParam('skeletonScale', v)}
              min={0.3}
              max={1.0}
              step={0.01}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">X Offset</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.skeletonXOffset.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.skeletonXOffset]}
              onValueChange={([v]) => updateParam('skeletonXOffset', v)}
              min={-5}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Y Offset</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.skeletonYOffset.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.skeletonYOffset]}
              onValueChange={([v]) => updateParam('skeletonYOffset', v)}
              min={-5}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Z Depth Effect</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.skeletonZDepth.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.skeletonZDepth]}
              onValueChange={([v]) => updateParam('skeletonZDepth', v)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>

        {/* 3D Hand Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">3D Hand</h4>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Scale</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.hand3DScale.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.hand3DScale]}
              onValueChange={([v]) => updateParam('hand3DScale', v)}
              min={0.3}
              max={1.0}
              step={0.01}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">X Offset</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.hand3DXOffset.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.hand3DXOffset]}
              onValueChange={([v]) => updateParam('hand3DXOffset', v)}
              min={-5}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Y Offset</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.hand3DYOffset.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.hand3DYOffset]}
              onValueChange={([v]) => updateParam('hand3DYOffset', v)}
              min={-5}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">Z Depth</Label>
              <span className="text-xs text-muted-foreground font-mono">{params.hand3DZDepth.toFixed(1)}</span>
            </div>
            <Slider
              value={[params.hand3DZDepth]}
              onValueChange={([v]) => updateParam('hand3DZDepth', v)}
              min={1}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          Skeleton: scale={params.skeletonScale}, x={params.skeletonXOffset}, y={params.skeletonYOffset}, z={params.skeletonZDepth}<br/>
          3D: scale={params.hand3DScale}, x={params.hand3DXOffset}, y={params.hand3DYOffset}, z={params.hand3DZDepth}
        </p>
      </div>
    </Card>
  );
}
