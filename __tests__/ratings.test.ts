import { calculatePlayerStats, calculateAllStats } from "../src/lib/ratings";
import type { MatchEvent } from "../src/types";

const makeEvent = (type: MatchEvent["type"], playerId = "p1"): MatchEvent => ({
  id: Math.random().toString(),
  matchId: "m1",
  playerId,
  timestamp: 100,
  type,
});

describe("calculatePlayerStats", () => {
  it("starts at base 6.0 with no events", () => {
    const stats = calculatePlayerStats("p1", []);
    expect(stats.rating).toBe(6);
  });

  it("goal adds 5 to base rating", () => {
    const stats = calculatePlayerStats("p1", [makeEvent("Goal")]);
    expect(stats.rating).toBe(Math.min(10, 6 + 5));
    expect(stats.goals).toBe(1);
  });

  it("clamps maximum rating at 10", () => {
    const events = Array(5).fill(null).map(() => makeEvent("Goal"));
    const stats = calculatePlayerStats("p1", events);
    expect(stats.rating).toBe(10);
  });

  it("clamps minimum rating at 1", () => {
    const events = Array(20).fill(null).map(() => makeEvent("Missed Chance"));
    const stats = calculatePlayerStats("p1", events);
    expect(stats.rating).toBe(1);
  });

  it("counts assists correctly", () => {
    const events = [makeEvent("Assist"), makeEvent("Assist")];
    const stats = calculatePlayerStats("p1", events);
    expect(stats.assists).toBe(2);
  });

  it("separates positive and negative events", () => {
    const events = [makeEvent("Goal"), makeEvent("Assist"), makeEvent("Bad Pass"), makeEvent("Lost Possession")];
    const stats = calculatePlayerStats("p1", events);
    expect(stats.positiveEvents).toBe(2);
    expect(stats.negativeEvents).toBe(2);
  });

  it("only counts events for the given player", () => {
    const events = [makeEvent("Goal", "p1"), makeEvent("Goal", "p2"), makeEvent("Goal", "p2")];
    const stats = calculatePlayerStats("p1", events);
    expect(stats.goals).toBe(1);
  });
});

describe("calculateAllStats", () => {
  it("returns stats for all players", () => {
    const events = [makeEvent("Goal", "p1"), makeEvent("Assist", "p2")];
    const result = calculateAllStats(["p1", "p2"], events);
    expect(result["p1"].goals).toBe(1);
    expect(result["p2"].assists).toBe(1);
  });
});
