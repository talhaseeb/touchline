"use client";
import { cn } from "@/lib/utils";
import { getPositionGroup, GROUP_STYLES } from "@/lib/positions";
import type { MatchPlayer, Player, PlayerStats } from "@/types";

// Formation slot coordinates [x%, y%] on pitch (0,0 = top-left, 100,100 = bottom-right)
// GK at bottom (y≈88), FWD at top (y≈18)
const FORMATION_COORDS: Record<string, Array<[number, number]>> = {
  "4-4-2": [
    [50, 88], // GK
    [80, 72], [62, 70], [38, 70], [20, 72], // RB CB CB LB
    [82, 50], [60, 50], [40, 50], [18, 50], // RM CM CM LM
    [62, 22], [38, 22], // ST ST
  ],
  "4-3-3": [
    [50, 88], // GK
    [80, 72], [62, 70], [38, 70], [20, 72], // RB CB CB LB
    [72, 50], [50, 48], [28, 50], // CM CM CM
    [80, 22], [50, 18], [20, 22], // RW ST LW
  ],
  "4-2-3-1": [
    [50, 88], // GK
    [80, 72], [62, 70], [38, 70], [20, 72], // RB CB CB LB
    [63, 60], [37, 60], // CDM CDM
    [75, 40], [50, 38], [25, 40], // CAM CAM CAM
    [50, 18], // ST
  ],
  "3-5-2": [
    [50, 88], // GK
    [65, 72], [50, 70], [35, 72], // CB CB CB
    [85, 50], [65, 50], [50, 48], [35, 50], [15, 50], // RM CM CM CM LM
    [62, 22], [38, 22], // ST ST
  ],
  "5-3-2": [
    [50, 88], // GK
    [85, 63], [67, 72], [50, 74], [33, 72], [15, 63], // RWB CB CB CB LWB
    [68, 48], [50, 46], [32, 48], // CM CM CM
    [62, 22], [38, 22], // ST ST
  ],
};

const DEFAULT_COORDS: Array<[number, number]> = FORMATION_COORDS["4-4-2"];

export interface PitchPlayer {
  matchPlayer: MatchPlayer;
  player: Player;
  stats?: PlayerStats | null;
}

interface FootballPitchProps {
  formation: string;
  starters: PitchPlayer[];
  bench?: PitchPlayer[];
  onPlayerClick?: (mpId: string) => void;
  selectedMpId?: string | null;
  showRatings?: boolean;
  className?: string;
}

function ratingColor(r: number) {
  if (r >= 8) return "#4ade80";
  if (r >= 6.5) return "#a3e635";
  if (r >= 5) return "#facc15";
  if (r >= 3.5) return "#fb923c";
  return "#f87171";
}

export function FootballPitch({
  formation,
  starters,
  bench = [],
  onPlayerClick,
  selectedMpId,
  showRatings = false,
  className,
}: FootballPitchProps) {
  const coords = FORMATION_COORDS[formation] ?? DEFAULT_COORDS;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Pitch */}
      <div className="relative w-full" style={{ paddingBottom: "140%" }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: "#166534" }}>
          {/* Pitch stripes */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x={0} y={i * 14} width={100} height={7} fill="rgba(0,0,0,0.06)" />
            ))}
          </svg>

          {/* Pitch markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
            {/* Outer boundary */}
            <rect x="3" y="3" width="94" height="134" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
            {/* Halfway line */}
            <line x1="3" y1="70" x2="97" y2="70" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            {/* Center circle */}
            <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)" />
            {/* Top penalty area */}
            <rect x="25" y="3" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            {/* Top goal area */}
            <rect x="38" y="3" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            {/* Top goal */}
            <rect x="43" y="0" width="14" height="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            {/* Top penalty spot */}
            <circle cx="50" cy="15" r="0.8" fill="rgba(255,255,255,0.5)" />
            {/* Bottom penalty area */}
            <rect x="25" y="119" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            {/* Bottom goal area */}
            <rect x="38" y="130" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
            {/* Bottom goal */}
            <rect x="43" y="137" width="14" height="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            {/* Bottom penalty spot */}
            <circle cx="50" cy="125" r="0.8" fill="rgba(255,255,255,0.5)" />
          </svg>

          {/* Players */}
          {starters.map((pp, i) => {
            const [px, py] = coords[i] ?? [50, 50];
            const group = getPositionGroup(pp.matchPlayer.position);
            const styles = GROUP_STYLES[group];
            const isSelected = selectedMpId === pp.matchPlayer.id;
            const rating = pp.stats?.rating;

            // Map group to color for the ring
            const ringColors: Record<string, string> = {
              GK: "#f59e0b", DEF: "#3b82f6", MID: "#10b981", FWD: "#f43f5e",
            };
            const ringColor = ringColors[group] ?? "#22c55e";

            return (
              <button
                key={pp.matchPlayer.id}
                onClick={() => onPlayerClick?.(pp.matchPlayer.id)}
                disabled={!onPlayerClick}
                className={cn(
                  "absolute flex flex-col items-center gap-0.5 transition-all",
                  onPlayerClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                  isSelected ? "scale-110 z-20" : "z-10"
                )}
                style={{
                  left: `${px}%`,
                  top: `${py}%`,
                  transform: "translate(-50%, -50%)",
                  width: "14%",
                }}
              >
                {/* Player circle */}
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold transition-all"
                  style={{
                    width: "2.2rem",
                    height: "2.2rem",
                    background: isSelected
                      ? "#22c55e"
                      : "rgba(15,23,42,0.85)",
                    boxShadow: isSelected
                      ? `0 0 0 3px #22c55e, 0 4px 12px rgba(34,197,94,0.5)`
                      : `0 0 0 2.5px ${ringColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                    backdropFilter: "blur(4px)",
                    fontSize: "0.72rem",
                  }}
                >
                  {pp.player.jerseyNumber}
                </div>

                {/* Name label */}
                <div
                  className="text-center leading-none font-semibold truncate w-full px-0.5"
                  style={{
                    fontSize: "0.6rem",
                    color: isSelected ? "#86efac" : "rgba(255,255,255,0.9)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    maxWidth: "100%",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {pp.player.jerseyName}
                </div>

                {/* Rating bubble */}
                {showRatings && rating != null && (
                  <div
                    className="rounded-full font-bold leading-none px-1"
                    style={{
                      fontSize: "0.55rem",
                      color: ratingColor(rating),
                      background: "rgba(0,0,0,0.55)",
                      paddingTop: "1px",
                      paddingBottom: "1px",
                    }}
                  >
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
          <div className="flex flex-wrap gap-2">
            {bench.map((pp) => (
              <button
                key={pp.matchPlayer.id}
                onClick={() => onPlayerClick?.(pp.matchPlayer.id)}
                disabled={!onPlayerClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-left",
                  onPlayerClick ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95" : "cursor-default",
                  "bg-card border-border"
                )}
              >
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                  {pp.player.jerseyNumber}
                </span>
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
