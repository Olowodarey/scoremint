"use client";
import { useState, useEffect } from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";

import AppLayout from "./components/AppLayout";
import Homep from "./views/Home";
import Leaderboards from "./views/Leaderboards";
import CreatePrediction from "./views/CreatePrediction";
import Profile from "./components/profile";


interface AuthResponse {
  success: boolean;
  user?: {
    fid: number; // FID is the unique identifier for the user
    issuedAt?: number;
    expiresAt?: number;
  };
  message?: string; // Error messages come as 'message' not 'error'
}


export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [currentView, setCurrentView] = useState<'home' | 'leaderboards' | 'create' | 'profile'>('home');

  // Initialize the  miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
 
  

  // If you need to verify the user's identity, you can use the useQuickAuth hook.
  // This hook will verify the user's signature and return the user's FID. You can update
  // this to meet your needs. See the /app/api/auth/route.ts file for more details.
  // Note: If you don't need to verify the user's identity, you can get their FID and other user data
  // via `context.user.fid`.
  // const { data, isLoading, error } = useQuickAuth<{
  //   userFid: string;
  // }>("/api/auth");

  // Authentication hook - can be used if needed for future features
  useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });

  return (
      <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'home' && <Homep />}
      {currentView === 'leaderboards' && <Leaderboards />}
      {currentView === 'create' && <CreatePrediction />}
      {currentView === 'profile' && <Profile />}
    </AppLayout>
  );
}
