import { Moon, Sun, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GlobalControlsProps {
  onSettingsClick?: () => void;
  onThemeChange?: (isDark: boolean) => void;
  infoOpen?: boolean;
  onInfoOpenChange?: (open: boolean) => void;
}

export const GlobalControls = ({ onSettingsClick, onThemeChange, infoOpen, onInfoOpenChange }: GlobalControlsProps) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

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
    <div className="fixed top-4 right-4 z-50 flex gap-2">
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
        <PopoverContent className="w-80">
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
      
      <Button
        variant="outline"
        size="icon"
        onClick={onSettingsClick}
        className="h-10 w-10"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
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