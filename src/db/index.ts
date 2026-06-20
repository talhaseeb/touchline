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

// ─── Hardcoded squad (JRJ Jets) ──────────────────────────────────────────────
// These are seeded on first install so every device starts with the same squad.
// Edit this list in source to add/change players across all devices.
const SQUAD: Omit<Player, "id">[] = [
  { firstName: "Muhammad Ayyan", lastName: "Shahzad",  jerseyName: "A. SHAHZAD", jerseyNumber: 19, primaryPosition: "CAM", secondaryPosition: "CM",  active: true },
  { firstName: "Saad",          lastName: "Abdullah",  jerseyName: "ABDULLAH",   jerseyNumber: 21, primaryPosition: "GK",  secondaryPosition: undefined, active: true },
  { firstName: "Aayan Syed",    lastName: "Abdullah",  jerseyName: "AAYAN",      jerseyNumber: 1,  primaryPosition: "GK",  secondaryPosition: undefined, active: true },
  { firstName: "Abdul Momin",   lastName: "Shahzad",   jerseyName: "M. SHAHZAD", jerseyNumber: 9,  primaryPosition: "CB",  secondaryPosition: undefined, active: true },
  { firstName: "Awais",         lastName: "Mahmood",   jerseyName: "A. MAHMOOD", jerseyNumber: 42, primaryPosition: "CM",  secondaryPosition: undefined, active: true },
  { firstName: "Muhammad Ali",  lastName: "Saad",      jerseyName: "ALI",        jerseyNumber: 7,  primaryPosition: "ST",  secondaryPosition: "RW",     active: true },
  { firstName: "Rayan",         lastName: "Rizvi",     jerseyName: "RIZVI",      jerseyNumber: 15, primaryPosition: "RB",  secondaryPosition: undefined, active: true },
  { firstName: "Ayyan",         lastName: "Sana",      jerseyName: "SANA",       jerseyNumber: 10, primaryPosition: "CAM", secondaryPosition: "LW",     active: true },
  { firstName: "Saaim",         lastName: "Tariq",     jerseyName: "SAAIM T.",   jerseyNumber: 2,  primaryPosition: "LB",  secondaryPosition: undefined, active: true },
  { firstName: "Daanyaal",      lastName: "Raza",      jerseyName: "RAZA",       jerseyNumber: 3,  primaryPosition: "CB",  secondaryPosition: "CDM",    active: true },
  { firstName: "Talha Haseeb",  lastName: "Mohammed",  jerseyName: "TALHA",      jerseyNumber: 99, primaryPosition: "CB",  secondaryPosition: "RB",     active: true },
  { firstName: "Muhammad",      lastName: "Hamza",     jerseyName: "HAMZA",      jerseyNumber: 6,  primaryPosition: "CDM", secondaryPosition: "CM",     active: true },
  { firstName: "Humza",         lastName: "Khan",      jerseyName: "HUMZA K.",   jerseyNumber: 4,  primaryPosition: "CM",  secondaryPosition: "CDM",    active: true },
  { firstName: "Zaid",          lastName: "Syed",      jerseyName: "ZAID",       jerseyNumber: 77, primaryPosition: "RW",  secondaryPosition: "ST",     active: true },
  { firstName: "Mohammed Ahmed",lastName: "Khurram",   jerseyName: "AHMED K.",   jerseyNumber: 17, primaryPosition: "LM",  secondaryPosition: "LW",     active: true },
  { firstName: "Umer",          lastName: "Javaid",    jerseyName: "U. JAVAID",  jerseyNumber: 8,  primaryPosition: "RM",  secondaryPosition: "CM",     active: true },
  { firstName: "Muhammad",      lastName: "Hatim",     jerseyName: "HATIM",      jerseyNumber: 18, primaryPosition: "CM",  secondaryPosition: undefined, active: true },
  { firstName: "Muhammad Ali",  lastName: "Javaid",    jerseyName: "ALI",        jerseyNumber: 22, primaryPosition: "ST",  secondaryPosition: "CF",     active: true },
  { firstName: "Arqum",         lastName: "Riaz",      jerseyName: "ARQUM",      jerseyNumber: 11, primaryPosition: "LW",  secondaryPosition: "CAM",    active: true },
];

// ─── Opposition teams ─────────────────────────────────────────────────────────
const TEAMS: Omit<Team, "id">[] = [
  { name: "SEM Elite" },
  { name: "MAC XI" },
  { name: "Masjid Ayesha Falcons" },
  { name: "Markaz United" },
  { name: "MCE United" },
  { name: "Al Istiqamah FC" },
  { name: "MSA Hawks" },
];

export async function seedDatabase() {
  // Users
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.bulkAdd([
      { id: "user-admin",   username: "admin",   password: "touchline-admin",   role: "ADMIN" },
      { id: "user-coach",   username: "coach",   password: "touchline-coach",   role: "COACH" },
      { id: "user-captain", username: "captain", password: "touchline-captain", role: "CAPTAIN" },
    ]);
  }

  // Players — seed once; each player gets a stable id based on jersey number
  // so re-seeding on a wiped DB always produces the same ids
  const playerCount = await db.players.count();
  if (playerCount === 0) {
    await db.players.bulkAdd(
      SQUAD.map((p) => ({ id: `jrj-${p.jerseyNumber}`, ...p }))
    );
  }

  // Teams
  const teamCount = await db.teams.count();
  if (teamCount === 0) {
    await db.teams.bulkAdd(
      TEAMS.map((t, i) => ({ id: `team-${i}`, ...t }))
    );
  }
}
