import type { MatchEvent, EventType, PlayerStats } from "@/types";
import { EVENT_WEIGHTS, POSITIVE_EVENTS } from "@/types";

export function calculatePlayerStats(playerId: string, events: MatchEvent[]): PlayerStats {
  const playerEvents = events.filter((e) => e.playerId === playerId);

  const eventCounts = {} as Record<EventType, number>;
  let weightedSum = 0;
  let goals = 0;
  let assists = 0;
  let positiveEvents = 0;
  let negativeEvents = 0;

  for (const ev of playerEvents) {
    if (ev.type === "Substitution") continue; // substitutions don't affect rating
    eventCounts[ev.type] = (eventCounts[ev.type] || 0) + 1;
    weightedSum += EVENT_WEIGHTS[ev.type];
    if (ev.type === "Goal") goals++;
    if (ev.type === "Assist") assists++;
    if (POSITIVE_EVENTS.includes(ev.type)) positiveEvents++;
    else negativeEvents++;
  }

  // Base rating 6.0, clamped 1-10
  const rawRating = 6.0 + weightedSum;
  const rating = Math.min(10, Math.max(1, Math.round(rawRating * 10) / 10));

  return { playerId, goals, assists, positiveEvents, negativeEvents, rating, eventCounts };
}

export function calculateAllStats(
  playerIds: string[],
  events: MatchEvent[]
): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {};
  for (const id of playerIds) {
    stats[id] = calculatePlayerStats(id, events);
  }
  return stats;
}
