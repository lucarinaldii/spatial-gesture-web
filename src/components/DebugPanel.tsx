import { Card } from "@/components/ui/card";

interface DebugPanelProps {
  title: string;
  logs: string[];
  position?: "bottom-left" | "bottom-right";
}

export const DebugPanel = ({ title, logs, position = "bottom-left" }: DebugPanelProps) => {
  const positionClasses =
    position === "bottom-left"
      ? "left-4 bottom-4"
      : "right-4 bottom-4";

  if (logs.length === 0) return null;

  return (
    <div
      className={`fixed ${positionClasses} z-50 max-w-md w-[320px] text-xs text-muted-foreground`}
    >
      <Card className="bg-background/90 backdrop-blur-sm border border-border shadow-lg max-h-48 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Debug
          </span>
        </div>
        <div className="px-3 py-2 space-y-1 overflow-y-auto">
          {logs.slice(-40).map((log, idx) => (
            <div key={idx} className="font-mono leading-tight break-words">
              {log}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
