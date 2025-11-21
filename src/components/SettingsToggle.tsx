import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsToggleProps {
  onClick: () => void;
}

export const SettingsToggle = ({ onClick }: SettingsToggleProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="fixed top-4 right-40 z-50"
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
};
