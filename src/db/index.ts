import Dexie, { Table } from "dexie";
import type { User, Player, Team, Match, MatchPlayer, MatchEvent } from "@/types";

class TouchlineDB extends Dexie {
  users!: Table<User>;
  players!: Table<Player>;
  teams!: Table<Team>;
  matches!: Table<Match>;
  matchPlayers!: Table<MatchPlayer>;
  events!: Table<MatchEvent>;

  constructor() {
    super("TouchlineDB");
    this.version(1).stores({
      users: "id, username, role",
      players: "id, jerseyNumber, active",
      teams: "id, name",
      matches: "id, opponentId, date, status",
      matchPlayers: "id, matchId, playerId",
      events: "id, matchId, playerId, timestamp",
    });
  }
}

export const db = new TouchlineDB();

export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount > 0) return;

  await db.users.bulkAdd([
    { id: "user-admin", username: "admin", password: "touchline-admin", role: "ADMIN" },
    { id: "user-coach", username: "coach", password: "touchline-coach", role: "COACH" },
    { id: "user-captain", username: "captain", password: "touchline-captain", role: "CAPTAIN" },
  ]);
}
