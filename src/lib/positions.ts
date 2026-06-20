export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export const POSITION_GROUPS: Record<PositionGroup, { label: string; positions: string[] }> = {
  GK:  { label: "Goalkeepers", positions: ["GK"] },
  DEF: { label: "Defenders",   positions: ["CB", "RB", "LB", "RWB", "LWB"] },
  MID: { label: "Midfielders", positions: ["CDM", "CM", "CAM", "RM", "LM"] },
  FWD: { label: "Forwards",    positions: ["RW", "LW", "SS", "ST", "CF"] },
};

export function getPositionGroup(pos: string): PositionGroup {
  for (const [key, group] of Object.entries(POSITION_GROUPS)) {
    if (group.positions.includes(pos)) return key as PositionGroup;
  }
  return "MID";
}

export const GROUP_STYLES: Record<PositionGroup, { badge: string; ring: string; dot: string }> = {
  GK:  { badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",      ring: "ring-amber-500/60",   dot: "bg-amber-400" },
  DEF: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",         ring: "ring-blue-500/60",    dot: "bg-blue-400" },
  MID: { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", ring: "ring-emerald-500/60", dot: "bg-emerald-400" },
  FWD: { badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",         ring: "ring-rose-500/60",    dot: "bg-rose-400" },
};
