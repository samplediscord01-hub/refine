import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Home from "@/pages/home";
import AddMedia from "@/pages/add-media";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from './components/sidebar';
import { useEffect, useState } from 'react';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/add-media" component={AddMedia} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isElectronReady, setIsElectronReady] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electronEnv?.isElectron) {
      console.log('Running in Electron environment');
      console.log('Platform:', window.electronEnv.platform);
      console.log('Architecture:', window.electronEnv.arch);

      // Listen for server info updates
      if (window.electronAPI?.onServerInfo) {
        window.electronAPI.onServerInfo((event, serverInfo) => {
          console.log('Received server info update:', serverInfo);
          setIsElectronReady(true);
        });
      } else {
        setIsElectronReady(true);
      }
    } else {
      console.log('Running in browser environment');
      setIsElectronReady(true);
    }
  }, []);

  if (!isElectronReady && typeof window !== 'undefined' && window.electronEnv?.isElectron) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing CipherBox...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-hidden">
              <Router />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;