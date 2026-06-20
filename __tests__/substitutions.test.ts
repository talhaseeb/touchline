import { getSuggestedSubstitutes } from "../src/lib/substitutions";
import type { Player, MatchPlayer } from "../src/types";

const makePlayer = (id: string, primary: string, secondary?: string): Player => ({
  id,
  firstName: "Player",
  lastName: id,
  jerseyNumber: 1,
  primaryPosition: primary,
  secondaryPosition: secondary,
  active: true,
});

const makeMp = (playerId: string, onField: boolean, matchId = "m1"): MatchPlayer => ({
  id: `mp-${playerId}`,
  matchId,
  playerId,
  starting: onField,
  position: "CM",
  onField,
});

describe("getSuggestedSubstitutes", () => {
  it("returns same-position players first", () => {
    const current = makePlayer("p1", "CAM");
    const currentMp = makeMp("p1", true);
    const bench1 = makePlayer("p2", "CM");
    const bench2 = makePlayer("p3", "CAM");
    const allMps = [currentMp, makeMp("p2", false), makeMp("p3", false)];
    const allPlayers = [current, bench1, bench2];

    const result = getSuggestedSubstitutes(current, currentMp, allMps, allPlayers);
    expect(result[0].reason).toBe("Same Position");
    expect(result[0].player.id).toBe("p3");
  });

  it("returns secondary position match second", () => {
    const current = makePlayer("p1", "CAM");
    const currentMp = makeMp("p1", true);
    const bench1 = makePlayer("p2", "CM", "CAM");
    const bench2 = makePlayer("p3", "RW");
    const allMps = [currentMp, makeMp("p2", false), makeMp("p3", false)];
    const allPlayers = [current, bench1, bench2];

    const result = getSuggestedSubstitutes(current, currentMp, allMps, allPlayers);
    expect(result[0].reason).toBe("Secondary Position");
    expect(result[1].reason).toBe("Available");
  });

  it("excludes on-field players from bench", () => {
    const current = makePlayer("p1", "ST");
    const currentMp = makeMp("p1", true);
    const onField = makePlayer("p2", "ST");
    const allMps = [currentMp, makeMp("p2", true)];
    const allPlayers = [current, onField];

    const result = getSuggestedSubstitutes(current, currentMp, allMps, allPlayers);
    expect(result).toHaveLength(0);
  });
});
