import { useTheme } from "./ThemeProvider";
import { SunMedium, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed left-6 top-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full bg-background/60 backdrop-blur-sm">
            {theme === "light" ? (
              <SunMedium className="h-5 w-5 text-secondary" />
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
            <span className="sr-only">تغيير السمة</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="mr-2 mt-2">
          <DropdownMenuItem 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setTheme("light")}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <SunMedium className="ml-2 h-4 w-4 text-secondary" />
              <span>فاتح</span>
            </div>
            {theme === "light" && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setTheme("dark")}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Moon className="ml-2 h-4 w-4 text-primary" />
              <span>داكن</span>
            </div>
            {theme === "dark" && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setTheme("system")}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Monitor className="ml-2 h-4 w-4" />
              <span>النظام</span>
            </div>
            {theme === "system" && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ThemeToggle;
