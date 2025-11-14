import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface AlignmentParams {
  skeletonScale: number;
  hand3DScale: number;
  hand3DXOffset: number;
  hand3DYOffset: number;
  hand3DZDepth: number;
  skeletonZDepth: number;
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
      <h3 className="text-lg font-semibold text-foreground">Alignment Settings</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Skeleton Scale</Label>
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
            <Label className="text-sm">3D Hand Scale</Label>
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
            <Label className="text-sm">3D Hand X Offset</Label>
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
            <Label className="text-sm">3D Hand Y Offset</Label>
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
            <Label className="text-sm">3D Hand Z Depth</Label>
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Skeleton Z Depth Effect</Label>
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

      <div className="pt-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          Current Values:<br/>
          skeletonScale: {params.skeletonScale}<br/>
          hand3DScale: {params.hand3DScale}<br/>
          hand3DXOffset: {params.hand3DXOffset}<br/>
          hand3DYOffset: {params.hand3DYOffset}<br/>
          hand3DZDepth: {params.hand3DZDepth}<br/>
          skeletonZDepth: {params.skeletonZDepth}
        </p>
      </div>
    </Card>
  );
}
