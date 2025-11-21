import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, RotateCcw, Image, Link, Eye, EyeOff, Settings as SettingsIcon, Save, X, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlignmentParams } from '@/components/AlignmentSettings';

export interface SettingsPanelProps {
  showConnectors: boolean;
  setShowConnectors: (show: boolean) => void;
  show3DHand: boolean;
  setShow3DHand: (show: boolean) => void;
  showSkeleton: boolean;
  setShowSkeleton: (show: boolean) => void;
  showPlane: boolean;
  setShowPlane: (show: boolean) => void;
  onRestart: () => void;
  onImportFile: () => void;
  onBackgroundUpload: () => void;
  onClose: () => void;
  onShowAdvancedSettings: () => void;
  alignmentParams: AlignmentParams;
  onImportOBJ: () => void;
  onCalibrateCursor: () => void;
}

export const SettingsPanel = ({
  showConnectors,
  setShowConnectors,
  show3DHand,
  setShow3DHand,
  showSkeleton,
  setShowSkeleton,
  showPlane,
  setShowPlane,
  onRestart,
  onImportFile,
  onBackgroundUpload,
  onClose,
  onShowAdvancedSettings,
  alignmentParams,
  onImportOBJ,
  onCalibrateCursor,
}: SettingsPanelProps) => {
  const { toast } = useToast();

  const handleSaveSettings = () => {
    const settings = {
      showConnectors,
      show3DHand,
      showSkeleton,
      alignmentParams,
    };
    
    localStorage.setItem('spatialUISettings', JSON.stringify(settings));
    toast({
      title: "Settings saved!",
      description: "Your preferences including hand calibration have been saved as defaults",
    });
  };

  return (
    <Card className="w-96 max-h-[80vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Settings & Controls
          </CardTitle>
          <CardDescription>Manage your spatial interface</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actions Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={onImportFile} variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Import File
            </Button>
            <Button onClick={onImportOBJ} variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Import OBJ
            </Button>
            <Button onClick={onBackgroundUpload} variant="outline" className="w-full justify-start">
              <Image className="w-4 h-4 mr-2" />
              Change Background
            </Button>
            <Button onClick={onRestart} variant="destructive" className="w-full justify-start">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>

        <Separator />

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Display</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="connectors" className="flex items-center gap-2 cursor-pointer">
              <Link className="w-4 h-4" />
              Show Connectors
            </Label>
            <Switch
              id="connectors"
              checked={showConnectors}
              onCheckedChange={setShowConnectors}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="3dhand" className="flex items-center gap-2 cursor-pointer">
              {show3DHand ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              3D Hand Model
            </Label>
            <Switch
              id="3dhand"
              checked={show3DHand}
              onCheckedChange={setShow3DHand}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="skeleton" className="flex items-center gap-2 cursor-pointer">
              {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Hand Skeleton
            </Label>
            <Switch
              id="skeleton"
              checked={showSkeleton}
              onCheckedChange={setShowSkeleton}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="plane" className="flex items-center gap-2 cursor-pointer">
              {showPlane ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              3D Plane
            </Label>
            <Switch
              id="plane"
              checked={showPlane}
              onCheckedChange={setShowPlane}
            />
          </div>
        </div>

        <Separator />

        {/* Save Settings */}
        <Button onClick={handleSaveSettings} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          Save as Default
        </Button>

        {/* Advanced Settings */}
        <Button onClick={onShowAdvancedSettings} variant="outline" className="w-full" size="lg">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Advanced Alignment
        </Button>

        {/* Cursor Calibration */}
        <Button onClick={onCalibrateCursor} variant="outline" className="w-full" size="lg">
          <Target className="w-4 h-4 mr-2" />
          Calibrate Cursor
        </Button>
      </CardContent>
    </Card>
  );
};
