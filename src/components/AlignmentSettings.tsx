import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface AlignmentParams {
  scale: number;
  xOffset: number;
  yOffset: number;
  zDepth: number;
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
      <h3 className="text-lg font-semibold text-foreground">Hand Alignment</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Hand Scale</Label>
            <span className="text-xs text-muted-foreground font-mono">{params.scale.toFixed(2)}</span>
          </div>
          <Slider
            value={[params.scale]}
            onValueChange={([v]) => updateParam('scale', v)}
            min={0.3}
            max={1.0}
            step={0.01}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">X Offset</Label>
            <span className="text-xs text-muted-foreground font-mono">{params.xOffset.toFixed(2)}</span>
          </div>
          <Slider
            value={[params.xOffset]}
            onValueChange={([v]) => updateParam('xOffset', v)}
            min={-5}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Y Offset</Label>
            <span className="text-xs text-muted-foreground font-mono">{params.yOffset.toFixed(2)}</span>
          </div>
          <Slider
            value={[params.yOffset]}
            onValueChange={([v]) => updateParam('yOffset', v)}
            min={-5}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Z Depth</Label>
            <span className="text-xs text-muted-foreground font-mono">{params.zDepth.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.zDepth]}
            onValueChange={([v]) => updateParam('zDepth', v)}
            min={1}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Skeleton Depth Effect</Label>
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
          scale: {params.scale}<br/>
          xOffset: {params.xOffset}<br/>
          yOffset: {params.yOffset}<br/>
          zDepth: {params.zDepth}<br/>
          skeletonZDepth: {params.skeletonZDepth}
        </p>
      </div>
    </Card>
  );
}
