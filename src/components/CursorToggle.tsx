import { MousePointer2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CursorToggleProps {
  showCursor: boolean;
  onToggleCursor: (show: boolean) => void;
  onCalibrate: () => void;
}

export const CursorToggle = ({ showCursor, onToggleCursor, onCalibrate }: CursorToggleProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-28 z-50"
        >
          <MousePointerClick className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Cursor Settings</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="cursor-visibility" className="flex items-center gap-2 cursor-pointer">
              <MousePointer2 className="w-4 h-4" />
              Show Cursor
            </Label>
            <Switch
              id="cursor-visibility"
              checked={showCursor}
              onCheckedChange={onToggleCursor}
            />
          </div>

          <Button
            onClick={onCalibrate}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Calibrate Position
          </Button>

          <p className="text-xs text-muted-foreground">
            The cursor appears when you pinch and follows your index finger movement.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
