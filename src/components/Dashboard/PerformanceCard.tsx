import type { LucideIcon } from "lucide-react";
export function PerformanceCard({
  icon: Icon,
  label,
  value,
  sub,
  theme,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  theme: string;
}) {
  return (
    <article className={`dash-banner-card ${theme}`}>
      <div className="dash-banner-icon">
        <Icon size={27} />
      </div>
      <div className="dash-banner-body">
        <div className="dash-banner-label">{label}</div>
        <div className="dash-banner-value">{value}</div>
        <div className="dash-banner-sub">{sub}</div>
      </div>
      <svg className="spark" viewBox="0 0 90 35">
        <path d="M2 30 C15 25, 19 10, 32 19 S54 5, 65 12 S78 6, 89 2" fill="none" stroke="white" strokeWidth="2" />
      </svg>
    </article>
  );
}
