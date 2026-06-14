import type { ReactNode } from "react";

interface Props {
  icon: string;
  title: string;
  children?: ReactNode;
}

/** Standard header for the dark "pitch" panels: a frosted icon chip + title. */
export default function PanelHeader({ icon, title, children }: Props) {
  return (
    <div className="pitch-panel flex items-start gap-3">
      <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 text-2xl shadow-inner">
        {icon}
      </span>
      <div className="min-w-0 relative z-10">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {children && <div className="text-sm text-white/80 mt-1">{children}</div>}
      </div>
    </div>
  );
}
