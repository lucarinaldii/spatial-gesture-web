import { Moon, Sun, Info, Settings, Eye, EyeOff, RotateCcw, Image, Plus, Save, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface GlobalControlsProps {
  onSettingsClick?: () => void;
  onThemeChange?: (isDark: boolean) => void;
  infoOpen?: boolean;
  onInfoOpenChange?: (open: boolean) => void;
  // Settings props
  showConnectors?: boolean;
  setShowConnectors?: (show: boolean) => void;
  show3DHand?: boolean;
  setShow3DHand?: (show: boolean) => void;
  showSkeleton?: boolean;
  setShowSkeleton?: (show: boolean) => void;
  showPlane?: boolean;
  setShowPlane?: (show: boolean) => void;
  showKioskCursor?: boolean;
  setShowKioskCursor?: (show: boolean) => void;
  onRestart?: () => void;
  onImportFile?: () => void;
  onBackgroundUpload?: () => void;
  onImportOBJ?: () => void;
}

export const GlobalControls = ({ 
  onThemeChange, 
  infoOpen, 
  onInfoOpenChange,
  showConnectors,
  setShowConnectors,
  show3DHand,
  setShow3DHand,
  showSkeleton,
  setShowSkeleton,
  showPlane,
  setShowPlane,
  showKioskCursor,
  setShowKioskCursor,
  onRestart,
  onImportFile,
  onBackgroundUpload,
  onImportOBJ,
}: GlobalControlsProps) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Set initial theme on mount
  useEffect(() => {
    const root = window.document.documentElement;
    const saved = localStorage.getItem("theme");
    const shouldBeDark = saved ? saved === "dark" : false;
    
    if (shouldBeDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Notify parent of initial theme
    onThemeChange?.(shouldBeDark);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
    
    // Notify parent of theme change
    onThemeChange?.(isDark);
  }, [isDark, onThemeChange]);

  return (
    <div className="fixed top-4 right-4 z-[60] flex gap-2">
      <Popover open={infoOpen} onOpenChange={onInfoOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            title="Info"
          >
            <Info className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 z-[70]">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Available Gestures:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span><strong className="text-primary">Point:</strong> Move your index finger to control the cursor</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span><strong className="text-secondary">Pinch:</strong> Touch thumb and index finger to click</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span><strong className="text-accent">Touch Drag:</strong> Point with closed fist and move closer to drag cards</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span><strong className="text-primary">Merge:</strong> Pinch two cards and bring them close together</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span><strong className="text-secondary">Split:</strong> Pinch one card with both hands and pull apart</span>
              </li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Settings Dropdown */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 z-[70]" align="end">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Settings</h3>
            
            {/* Actions */}
            {(onImportFile || onBackgroundUpload || onImportOBJ || onRestart) && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {onImportFile && (
                    <Button onClick={onImportFile} variant="outline" size="sm" className="justify-start">
                      <Plus className="w-3 h-3 mr-1" />
                      Import
                    </Button>
                  )}
                  {onImportOBJ && (
                    <Button onClick={onImportOBJ} variant="outline" size="sm" className="justify-start">
                      <Plus className="w-3 h-3 mr-1" />
                      OBJ
                    </Button>
                  )}
                  {onBackgroundUpload && (
                    <Button onClick={onBackgroundUpload} variant="outline" size="sm" className="justify-start">
                      <Image className="w-3 h-3 mr-1" />
                      BG
                    </Button>
                  )}
                  {onRestart && (
                    <Button onClick={onRestart} variant="destructive" size="sm" className="justify-start">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restart
                    </Button>
                  )}
                </div>
                <Separator />
              </>
            )}
            
            {/* Display Settings */}
            <div className="space-y-3">
              {setShowConnectors !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="connectors" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Link className="w-3 h-3" />
                    Connectors
                  </Label>
                  <Switch
                    id="connectors"
                    checked={showConnectors}
                    onCheckedChange={setShowConnectors}
                  />
                </div>
              )}

              {setShow3DHand !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="3dhand" className="flex items-center gap-2 cursor-pointer text-sm">
                    {show3DHand ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    3D Hand
                  </Label>
                  <Switch
                    id="3dhand"
                    checked={show3DHand}
                    onCheckedChange={setShow3DHand}
                  />
                </div>
              )}

              {setShowSkeleton !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="skeleton" className="flex items-center gap-2 cursor-pointer text-sm">
                    {showSkeleton ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Skeleton
                  </Label>
                  <Switch
                    id="skeleton"
                    checked={showSkeleton}
                    onCheckedChange={setShowSkeleton}
                  />
                </div>
              )}

              {setShowPlane !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="plane" className="flex items-center gap-2 cursor-pointer text-sm">
                    {showPlane ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    3D Plane
                  </Label>
                  <Switch
                    id="plane"
                    checked={showPlane}
                    onCheckedChange={setShowPlane}
                  />
                </div>
              )}

              {setShowKioskCursor !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="kiosk-cursor" className="flex items-center gap-2 cursor-pointer text-sm">
                    {showKioskCursor ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Cursor
                  </Label>
                  <Switch
                    id="kiosk-cursor"
                    checked={showKioskCursor}
                    onCheckedChange={setShowKioskCursor}
                  />
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDark(!isDark)}
        className="h-10 w-10"
        title="Toggle theme"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </div>
  );
};