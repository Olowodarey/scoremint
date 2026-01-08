"use client";

import { Wallet } from "@coinbase/onchainkit/wallet";

interface HeaderProps {
  onProfileClick?: () => void;
}

export default function Header({ onProfileClick }: HeaderProps) {
  return (
    <header className="flex justify-between items-center px-4 md:px-6 py-3 bg-dark-lighter border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-white font-semibold text-lg">ScoreMint</span>
      </div>

      <div className="flex items-center gap-3">
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-blue-500/10 transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40"
            aria-label="Profile"
          >
            <span className="text-lg">👤</span>
            <span className="hidden md:inline text-sm font-medium">
              Profile
            </span>
          </button>
        )}
        <Wallet />
      </div>
    </header>
  );
}
