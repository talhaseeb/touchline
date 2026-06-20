import type { Player, MatchPlayer } from "@/types";

export interface SubstituteSuggestion {
  player: Player;
  matchPlayer: MatchPlayer;
  reason: "Same Position" | "Secondary Position" | "Available";
}

export function getSuggestedSubstitutes(
  currentPlayer: Player,
  currentMatchPlayer: MatchPlayer,
  allMatchPlayers: MatchPlayer[],
  allPlayers: Player[]
): SubstituteSuggestion[] {
  const benchPlayers = allMatchPlayers.filter(
    (mp) => !mp.onField && mp.matchId === currentMatchPlayer.matchId
  );

  const suggestions: SubstituteSuggestion[] = [];

  for (const mp of benchPlayers) {
    const player = allPlayers.find((p) => p.id === mp.playerId);
    if (!player) continue;

    if (player.primaryPosition === currentPlayer.primaryPosition) {
      suggestions.push({ player, matchPlayer: mp, reason: "Same Position" });
    } else if (
      player.secondaryPosition === currentPlayer.primaryPosition ||
      player.primaryPosition === currentPlayer.secondaryPosition
    ) {
      suggestions.push({ player, matchPlayer: mp, reason: "Secondary Position" });
    } else {
      suggestions.push({ player, matchPlayer: mp, reason: "Available" });
    }
  }

  // Sort: Same Position first, then Secondary, then Available
  const order = { "Same Position": 0, "Secondary Position": 1, Available: 2 };
  return suggestions.sort((a, b) => order[a.reason] - order[b.reason]);
}
