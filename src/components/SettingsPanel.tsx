import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, RotateCcw, Image, Link, Mic, MicOff, Eye, EyeOff, Settings as SettingsIcon, Save, X, CheckCircle2 } from 'lucide-react';
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
  showCameraPreview: boolean;
  setShowCameraPreview: (show: boolean) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isVoiceSupported: boolean;
  onRestart: () => void;
  onImportFile: () => void;
  onBackgroundUpload: () => void;
  onClose: () => void;
  commandRecognized: boolean;
  onShowAdvancedSettings: () => void;
  alignmentParams: AlignmentParams;
  onImportOBJ: () => void;
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
  showCameraPreview,
  setShowCameraPreview,
  isListening,
  startListening,
  stopListening,
  isVoiceSupported,
  onRestart,
  onImportFile,
  onBackgroundUpload,
  onClose,
  commandRecognized,
  onShowAdvancedSettings,
  alignmentParams,
  onImportOBJ,
}: SettingsPanelProps) => {
  const { toast } = useToast();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  const handleCheckPermissions = async () => {
    setIsCheckingPermissions(true);
    
    try {
      // Check if Speech Recognition API is supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: "Not supported",
          description: "Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        setIsCheckingPermissions(false);
        return;
      }

      // Try to request microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        // Test if we can create and start recognition
        const testRecognition = new SpeechRecognition();
        testRecognition.continuous = false;
        testRecognition.interimResults = false;
        
        testRecognition.onstart = () => {
          testRecognition.stop();
          toast({
            title: "✓ All permissions granted!",
            description: "Speech recognition is ready to use. You can now enable voice commands.",
          });
          setIsCheckingPermissions(false);
        };
        
        testRecognition.onerror = (event: any) => {
          toast({
            title: "Permission denied",
            description: "Please allow speech recognition and microphone access in your browser settings.",
            variant: "destructive",
          });
          setIsCheckingPermissions(false);
        };
        
        testRecognition.start();
      } catch (error) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
        setIsCheckingPermissions(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check permissions. Please try again.",
        variant: "destructive",
      });
      setIsCheckingPermissions(false);
    }
  };

  const handleSaveSettings = () => {
    const settings = {
      showConnectors,
      show3DHand,
      showSkeleton,
      isListening,
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

          <div className="flex items-center justify-between">
            <Label htmlFor="camera-preview" className="flex items-center gap-2 cursor-pointer">
              {showCameraPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Phone Camera Preview
            </Label>
            <Switch
              id="camera-preview"
              checked={showCameraPreview}
              onCheckedChange={setShowCameraPreview}
            />
          </div>
        </div>

        <Separator />

        {/* Voice Control */}
        {isVoiceSupported && (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Voice Control</h3>
              
              {/* Permission Check Button */}
              <Button
                onClick={handleCheckPermissions}
                disabled={isCheckingPermissions}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isCheckingPermissions ? 'Checking...' : 'Test Permissions'}
              </Button>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="voice" className="flex items-center gap-2 cursor-pointer">
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  Voice Commands
                  {commandRecognized && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Label>
                <Switch
                  id="voice"
                  checked={isListening}
                  onCheckedChange={(checked) => checked ? startListening() : stopListening()}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Say commands like "add new card", "delete the card" (while grabbing), or "clear all". 
                <span className="block mt-1 text-amber-500">Note: Voice commands require an internet connection for speech recognition.</span>
              </p>
            </div>

            <Separator />
          </>
        )}

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
      </CardContent>
    </Card>
  );
};
