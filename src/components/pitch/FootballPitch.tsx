"use client";
import { cn } from "@/lib/utils";
import { getPositionGroup, GROUP_STYLES } from "@/lib/positions";
import type { MatchPlayer, Player, PlayerStats } from "@/types";

// ── Position → half-pitch coordinate ────────────────────────────────────────
// y=0 top (attacking end), y=100 bottom (our goal)
// fixedX means no horizontal distribution (flank positions with defined side)
const POS_BASE: Record<string, { y: number; fixedX?: number }> = {
  GK:  { y: 88 },
  RB:  { y: 72, fixedX: 82 }, LB:  { y: 72, fixedX: 18 },
  CB:  { y: 70 },
  RWB: { y: 62, fixedX: 84 }, LWB: { y: 62, fixedX: 16 },
  CDM: { y: 58 }, DM: { y: 58 },
  CM:  { y: 46 },
  RM:  { y: 46, fixedX: 84 }, LM:  { y: 46, fixedX: 16 },
  CAM: { y: 34 }, AM: { y: 34 },
  RW:  { y: 20, fixedX: 82 }, LW:  { y: 20, fixedX: 18 },
  SS:  { y: 22 },
  ST:  { y: 13 }, CF: { y: 13 },
};

// Distribute n players evenly in the CENTRAL band (30%–70%), widening for more players.
// Keeps central roles away from the flank positions (RM/LM, RB/LB etc.)
function distributeX(n: number, i: number): number {
  if (n === 1) return 50;
  // bands: 2→[35,65], 3→[28,50,72], 4→[25,42,58,75], 5→[22,36,50,64,78]
  const lo = Math.max(50 - n * 10, 22);
  const hi = Math.min(50 + n * 10, 78);
  return lo + ((hi - lo) * i / (n - 1));
}

function computeCoords(players: PitchPlayer[]): Map<string, [number, number]> {
  // Group players by their assigned match position
  const byPos: Record<string, string[]> = {};
  for (const pp of players) {
    const pos = pp.matchPlayer.position;
    if (!byPos[pos]) byPos[pos] = [];
    byPos[pos].push(pp.matchPlayer.id);
  }
  const map = new Map<string, [number, number]>();
  for (const [pos, ids] of Object.entries(byPos)) {
    const base = POS_BASE[pos] ?? { y: 46 };
    ids.forEach((id, i) => {
      const x = base.fixedX !== undefined ? base.fixedX : distributeX(ids.length, i);
      map.set(id, [x, base.y]);
    });
  }
  return map;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface PitchPlayer {
  matchPlayer: MatchPlayer;
  player: Player;
  stats?: PlayerStats | null;
}

interface FootballPitchProps {
  formation?: string;
  starters: PitchPlayer[];
  bench?: PitchPlayer[];
  onPlayerClick?: (mpId: string) => void;
  selectedMpId?: string | null;
  showRatings?: boolean;
  className?: string;
}

// Ring colour per position group
const RING_COLOR: Record<string, string> = {
  GK: "#f59e0b", DEF: "#3b82f6", MID: "#10b981", FWD: "#f43f5e",
};

function ratingColor(r: number) {
  if (r >= 8) return "#4ade80";
  if (r >= 6.5) return "#a3e635";
  if (r >= 5) return "#facc15";
  if (r >= 3.5) return "#fb923c";
  return "#f87171";
}

// ── Component ────────────────────────────────────────────────────────────────
export function FootballPitch({
  starters,
  bench = [],
  onPlayerClick,
  selectedMpId,
  showRatings = false,
  className,
}: FootballPitchProps) {
  const coords = computeCoords(starters);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Half-pitch */}
      <div className="relative w-full" style={{ paddingBottom: "70%" }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: "#166534" }}>

          {/* Stripe texture */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 70" preserveAspectRatio="none">
            {Array.from({ length: 5 }).map((_, i) => (
              <rect key={i} x={0} y={i * 14} width={100} height={7} fill="rgba(0,0,0,0.06)" />
            ))}
          </svg>

          {/* Pitch markings — half pitch, our goal at bottom */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 70" preserveAspectRatio="none">
            {/* Outer boundary */}
            <rect x="2" y="2" width="96" height="66" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
            {/* Halfway line (top) dashed */}
            <line x1="2" y1="2" x2="98" y2="2" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="3,2" />
            {/* Penalty area */}
            <rect x="24" y="40" width="52" height="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
            {/* Goal area */}
            <rect x="37" y="56" width="26" height="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
            {/* Goal */}
            <rect x="43" y="67.5" width="14" height="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
            {/* Penalty spot */}
            <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.55)" />
            {/* Penalty arc — partial circle above penalty area */}
            <path d="M 34 40 A 16 16 0 0 1 66 40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          </svg>

          {/* Player tokens */}
          {starters.map((pp) => {
            const [px, py] = coords.get(pp.matchPlayer.id) ?? [50, 50];
            const group = getPositionGroup(pp.matchPlayer.position);
            const ringColor = RING_COLOR[group] ?? "#22c55e";
            const isSelected = selectedMpId === pp.matchPlayer.id;
            const rating = pp.stats?.rating;

            return (
              <button
                key={pp.matchPlayer.id}
                onClick={() => onPlayerClick?.(pp.matchPlayer.id)}
                disabled={!onPlayerClick}
                className={cn(
                  "absolute flex flex-col items-center transition-all",
                  onPlayerClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                  isSelected ? "scale-110 z-20" : "z-10"
                )}
                style={{
                  left: `${px}%`,
                  top: `${py}%`,
                  transform: "translate(-50%, -50%)",
                  width: "11%",
                  gap: "2px",
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    background: isSelected ? "#22c55e" : "rgba(10,18,38,0.88)",
                    boxShadow: isSelected
                      ? `0 0 0 2.5px #22c55e, 0 3px 10px rgba(34,197,94,0.55)`
                      : `0 0 0 2px ${ringColor}, 0 2px 6px rgba(0,0,0,0.5)`,
                    backdropFilter: "blur(4px)",
                    fontSize: "0.68rem",
                  }}
                >
                  {pp.player.jerseyNumber}
                </div>
                <div
                  className="font-semibold truncate w-full text-center px-0.5"
                  style={{
                    fontSize: "0.58rem",
                    color: isSelected ? "#86efac" : "rgba(255,255,255,0.92)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {pp.player.jerseyName}
                </div>
                {showRatings && rating != null && (
                  <div style={{
                    fontSize: "0.52rem",
                    color: ratingColor(rating),
                    background: "rgba(0,0,0,0.6)",
                    padding: "1px 3px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}>
                    {rating.toFixed(1)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">Bench</p>
          <div className="flex flex-wrap gap-1.5">
            {bench.map((pp) => (
              <button
                key={pp.matchPlayer.id}
                onClick={() => onPlayerClick?.(pp.matchPlayer.id)}
                disabled={!onPlayerClick}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-left",
                  onPlayerClick ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95" : "cursor-default",
                  "bg-card/60 border-border/60"
                )}
              >
                <span className="text-xs font-bold text-muted-foreground">{pp.player.jerseyNumber}</span>
                <span className="text-xs font-medium">{pp.player.jerseyName}</span>
                {pp.stats && showRatings && (
                  <span className="text-xs font-bold tabular-nums" style={{ color: ratingColor(pp.stats.rating) }}>
                    {pp.stats.rating.toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
