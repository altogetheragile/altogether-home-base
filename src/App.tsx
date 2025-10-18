import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  PublicRoutes,
  ProtectedUserRoutes,
  AdminRoutes,
  DynamicRoutes,
  FallbackRoutes,
} from "@/config/routes";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              {PublicRoutes()}
              
              {/* Protected User Routes */}
              {ProtectedUserRoutes()}
              
              {/* Admin Routes */}
              {AdminRoutes()}
              
              {/* Dynamic CMS Routes */}
              {DynamicRoutes()}
              
              {/* 404 Fallback */}
              {FallbackRoutes()}
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
