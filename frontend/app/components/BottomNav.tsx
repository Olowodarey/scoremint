"use client";

interface BottomNavProps {
  currentView: "home" | "leaderboards" | "create" | "profile";
  onNavigate: (view: "home" | "leaderboards" | "create" | "profile") => void;
}

export default function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: "home" as const, icon: "🏠", label: "Home" },
    { id: "leaderboards" as const, icon: "🏆", label: "Leaderboards" },
    { id: "create" as const, icon: "➕", label: "Create" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 py-3 bg-[#0d1528] backdrop-blur-xl shadow-lg shadow-blue-900/30 border-t border-blue-500/20">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
              currentView === item.id
                ? "text-white bg-blue-600/30 shadow-lg shadow-blue-500/20 scale-105 backdrop-blur-sm border border-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-blue-500/10 hover:scale-105"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
