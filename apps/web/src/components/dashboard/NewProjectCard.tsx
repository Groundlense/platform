"use client";

interface NewProjectCardProps {
  onClick: () => void;
}

/* Matches .new-proj-card: bg-surface, dashed border-mid, rounded-[10px], min-h 200px */
export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-bg-surface border border-dashed border-border-mid rounded-[10px] flex flex-col items-center justify-center gap-2 min-h-[200px] cursor-pointer transition-all duration-150 hover:border-rust-mid"
    >
      <div className="text-[28px] text-text-ter leading-none">+</div>
      <div className="text-[12px] text-text-sec font-medium">Create new project</div>
      <div className="text-[10px] text-text-ter text-center leading-relaxed max-w-[180px]">Set up borings, link parties, generate IS 1892 reports</div>
    </div>
  );
}
