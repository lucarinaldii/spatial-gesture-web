import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface AlignmentParams {
  leftHand: {
    skeletonScale: number;
    skeletonXOffset: number;
    skeletonYOffset: number;
    skeletonZDepth: number;
    hand3DScale: number;
    hand3DXOffset: number;
    hand3DYOffset: number;
    hand3DZDepth: number;
  };
  rightHand: {
    skeletonScale: number;
    skeletonXOffset: number;
    skeletonYOffset: number;
    skeletonZDepth: number;
    hand3DScale: number;
    hand3DXOffset: number;
    hand3DYOffset: number;
    hand3DZDepth: number;
  };
}

interface AlignmentSettingsProps {
  params: AlignmentParams;
  onParamsChange: (params: AlignmentParams) => void;
}

export default function AlignmentSettings({ params, onParamsChange }: AlignmentSettingsProps) {
  const updateLeftParam = (key: keyof AlignmentParams['leftHand'], value: number) => {
    onParamsChange({ ...params, leftHand: { ...params.leftHand, [key]: value } });
  };
  
  const updateRightParam = (key: keyof AlignmentParams['rightHand'], value: number) => {
    onParamsChange({ ...params, rightHand: { ...params.rightHand, [key]: value } });
  };

  return (
    <Card className="glass-panel p-4 space-y-4 max-w-sm max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-foreground mb-4">Hand Alignment</h3>
      
      <div className="space-y-4">
        {/* Left Hand Controls */}
        <div className="space-y-3 pb-3 border-b border-border/30">
          <h4 className="text-sm font-semibold text-primary">Left Hand</h4>
          
          <div className="pl-2 space-y-3">
            <h5 className="text-xs font-semibold text-muted-foreground">Skeleton</h5>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Scale</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.skeletonScale.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.skeletonScale]}
                onValueChange={([v]) => updateLeftParam('skeletonScale', v)}
                min={0.3}
                max={1.0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">X Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.skeletonXOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.skeletonXOffset]}
                onValueChange={([v]) => updateLeftParam('skeletonXOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Y Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.skeletonYOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.skeletonYOffset]}
                onValueChange={([v]) => updateLeftParam('skeletonYOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Z Depth</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.skeletonZDepth.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.skeletonZDepth]}
                onValueChange={([v]) => updateLeftParam('skeletonZDepth', v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>

            <h5 className="text-xs font-semibold text-muted-foreground pt-2">3D Hand</h5>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Scale</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.hand3DScale.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.hand3DScale]}
                onValueChange={([v]) => updateLeftParam('hand3DScale', v)}
                min={0.3}
                max={1.0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">X Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.hand3DXOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.hand3DXOffset]}
                onValueChange={([v]) => updateLeftParam('hand3DXOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Y Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.hand3DYOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.leftHand.hand3DYOffset]}
                onValueChange={([v]) => updateLeftParam('hand3DYOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Z Depth</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.leftHand.hand3DZDepth.toFixed(1)}</span>
              </div>
              <Slider
                value={[params.leftHand.hand3DZDepth]}
                onValueChange={([v]) => updateLeftParam('hand3DZDepth', v)}
                min={1}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Right Hand Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-secondary">Right Hand</h4>
          
          <div className="pl-2 space-y-3">
            <h5 className="text-xs font-semibold text-muted-foreground">Skeleton</h5>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Scale</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.skeletonScale.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.skeletonScale]}
                onValueChange={([v]) => updateRightParam('skeletonScale', v)}
                min={0.3}
                max={1.0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">X Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.skeletonXOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.skeletonXOffset]}
                onValueChange={([v]) => updateRightParam('skeletonXOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Y Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.skeletonYOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.skeletonYOffset]}
                onValueChange={([v]) => updateRightParam('skeletonYOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Z Depth</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.skeletonZDepth.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.skeletonZDepth]}
                onValueChange={([v]) => updateRightParam('skeletonZDepth', v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>

            <h5 className="text-xs font-semibold text-muted-foreground pt-2">3D Hand</h5>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Scale</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.hand3DScale.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.hand3DScale]}
                onValueChange={([v]) => updateRightParam('hand3DScale', v)}
                min={0.3}
                max={1.0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">X Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.hand3DXOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.hand3DXOffset]}
                onValueChange={([v]) => updateRightParam('hand3DXOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Y Offset</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.hand3DYOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[params.rightHand.hand3DYOffset]}
                onValueChange={([v]) => updateRightParam('hand3DYOffset', v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs">Z Depth</Label>
                <span className="text-xs text-muted-foreground font-mono">{params.rightHand.hand3DZDepth.toFixed(1)}</span>
              </div>
              <Slider
                value={[params.rightHand.hand3DZDepth]}
                onValueChange={([v]) => updateRightParam('hand3DZDepth', v)}
                min={1}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          L: skel({params.leftHand.skeletonScale}, {params.leftHand.skeletonXOffset}, {params.leftHand.skeletonYOffset}, {params.leftHand.skeletonZDepth}) 3d({params.leftHand.hand3DScale}, {params.leftHand.hand3DXOffset}, {params.leftHand.hand3DYOffset}, {params.leftHand.hand3DZDepth})<br/>
          R: skel({params.rightHand.skeletonScale}, {params.rightHand.skeletonXOffset}, {params.rightHand.skeletonYOffset}, {params.rightHand.skeletonZDepth}) 3d({params.rightHand.hand3DScale}, {params.rightHand.hand3DXOffset}, {params.rightHand.hand3DYOffset}, {params.rightHand.hand3DZDepth})
        </p>
      </div>
    </Card>
  );
}
