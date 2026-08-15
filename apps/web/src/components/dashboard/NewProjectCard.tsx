"use client";

interface NewProjectCardProps {
  onClick: () => void;
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-bg-surface/50 border border-dashed border-border-mid rounded-xl flex flex-col items-center justify-center gap-[10px] min-h-[240px] p-6 cursor-pointer transition-all duration-150 hover:border-rust-mid hover:bg-bg-surface"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] leading-none text-rust-d transition-colors"
        style={{ background: "rgba(153,60,29,.12)", border: "1px solid rgba(153,60,29,.25)" }}>
        +
      </div>
      <div className="text-[12.5px] text-text-sec font-medium">Create new project</div>
      <div className="text-[10.5px] text-text-ter text-center leading-relaxed max-w-[190px]">
        Set up borings, link parties, generate IS 1892 reports
      </div>
    </div>
  );
}
