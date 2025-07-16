
import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/auth/AuthPage";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <BrowserRouter>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <Sidebar />
          </div>
          
          {/* Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
   
      <AuthProvider>
        
        <AuthenticatedApp />
      </AuthProvider>
   
  </QueryClientProvider>
);

export default App;
