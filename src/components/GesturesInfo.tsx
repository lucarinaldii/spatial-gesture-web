import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const GesturesInfo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-16 z-50"
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
  );
};
