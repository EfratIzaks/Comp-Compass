import { Sidebar } from "@/app/components/sidebar";
import { GlobalSettingsMenu } from "@/app/components/global-settings-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 bg-[#f4f6f9]">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end border-b border-slate-200/90 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <GlobalSettingsMenu />
        </header>
        {/* min-h-0 lets this flex item shrink so overflow-auto scrolls here (required for sticky descendants). */}
        <main
          data-app-scrollport
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
