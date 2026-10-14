import { useKBar } from "@refinedev/kbar";
import { MonitorIcon, MoonIcon, SearchIcon, SunIcon, UploadIcon } from "lucide-react";
import { Link } from "react-router";

import { useTheme } from "@/components/refine-ui/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Topbar() {
  const { query } = useKBar();
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />

      <button
        type="button"
        onClick={() => query.toggle()}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Jump to…</span>
        <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button asChild size="sm">
          <Link to="/alerts/create">
            <UploadIcon />
            <span className="hidden sm:inline">Upload log</span>
          </Link>
        </Button>
        <ThemeButton />
      </div>
    </header>
  );
}

const NEXT = { dark: "light", light: "system", system: "dark" } as const;
const ICONS = { dark: MoonIcon, light: SunIcon, system: MonitorIcon };

function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground"
      onClick={() => setTheme(NEXT[theme])}
      title={`Theme: ${theme}. Click for ${NEXT[theme]}.`}
    >
      <Icon />
      <span className="sr-only">Change theme</span>
    </Button>
  );
}
