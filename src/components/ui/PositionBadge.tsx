import { getPositionGroup, GROUP_STYLES } from "@/lib/positions";

export function PositionBadge({ position, className = "" }: { position: string; className?: string }) {
  const style = GROUP_STYLES[getPositionGroup(position)];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${style.badge} ${className}`}>
      {position}
    </span>
  );
}
