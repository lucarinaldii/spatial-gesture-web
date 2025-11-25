import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  onThemeChange?: (isDark: boolean) => void;
}

export const ThemeToggle = ({ onThemeChange }: ThemeToggleProps) => {
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
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="fixed top-4 right-4 z-50"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};