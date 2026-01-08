"use client";

import Header from "./Header";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: "home" | "leaderboards" | "create" | "profile";
  onNavigate: (view: "home" | "leaderboards" | "create" | "profile") => void;
}

export default function AppLayout({
  children,
  currentView,
  onNavigate,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-dark">
      <Header onProfileClick={() => onNavigate("profile")} />
      <main className="pb-16 max-w-7xl mx-auto">{children}</main>
      <BottomNav currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
}
