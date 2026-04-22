import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Settings } from "./pages/Settings.tsx";
import { Themes } from "./pages/Themes.tsx";
import { Analytics } from "./pages/Analytics.tsx";
import { About } from "./pages/About.tsx";
import { useEngine } from "@/services/engine";

const queryClient = new QueryClient();

/**
 * Use HashRouter when the app is loaded over the file:// protocol
 * (i.e. inside the packaged Electron .exe / .app / Linux binary).
 * BrowserRouter cannot work under file:// because window.location.pathname
 * resolves to the full disk path of index.html, which React Router treats
 * as an unknown route — producing the "404 / black screen" symptom.
 *
 * In the browser (dev server, Docker/nginx, Lovable preview) we keep
 * BrowserRouter so URLs stay clean.
 */
const isFileProtocol =
  typeof window !== "undefined" && window.location.protocol === "file:";
const Router = isFileProtocol ? HashRouter : BrowserRouter;

const Guarded = ({ children }: { children: React.ReactNode }) => {
  const onboarded = useEngine((s) => s.settings.onboarded);
  if (!onboarded) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Guarded><Settings /></Guarded>} />
          <Route path="/themes" element={<Guarded><Themes /></Guarded>} />
          <Route path="/analytics" element={<Guarded><Analytics /></Guarded>} />
          <Route path="/about" element={<Guarded><About /></Guarded>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
