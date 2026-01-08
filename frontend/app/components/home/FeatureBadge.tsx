"use client";

interface FeatureBadgeProps {
  icon: string;
  text: string;
}

export default function FeatureBadge({ icon, text }: FeatureBadgeProps) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-white/10 text-xs md:text-sm text-gray-300 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all cursor-default">
      <span>{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}
