import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { AppShell } from "@/components/AppShell";
import { TimeProvider } from "@/contexts/TimeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcuts";

import Dashboard from "./pages/DashboardPremium";
import TargetsList from "./pages/TargetsListPremium";
import TargetDetail from "./pages/TargetDetail";
import TargetForm from "./pages/TargetForm";
import ChangeDetail from "./pages/ChangeDetail";
import Notifications from "./pages/Notifications";
import Settings from "./pages/SettingsPremium";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TimeProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <KeyboardShortcutsProvider>
            <CommandPaletteProvider>
              <NotificationsProvider>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/targets" element={<TargetsList />} />
                    <Route path="/targets/new" element={<TargetForm />} />
                    <Route path="/targets/:id" element={<TargetDetail />} />
                    <Route path="/targets/:id/edit" element={<TargetForm />} />
                    <Route path="/changes/:id" element={<ChangeDetail />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppShell>
              </NotificationsProvider>
            </CommandPaletteProvider>
          </KeyboardShortcutsProvider>
        </BrowserRouter>
        <Sonner position="bottom-right" />
      </TooltipProvider>
    </TimeProvider>
  </QueryClientProvider>
);

export default App;
