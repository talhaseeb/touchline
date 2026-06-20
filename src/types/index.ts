export type UserRole = "ADMIN" | "COACH" | "CAPTAIN";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyName: string;       // name printed on the back of the shirt
  jerseyNumber: number;
  primaryPosition: string;
  secondaryPosition?: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
}

export type MatchStatus = "scheduled" | "live" | "completed";

export interface Match {
  id: string;
  opponentId: string;
  date: string;
  formation: string;
  startTime: string;
  endTime?: string;
  status: MatchStatus;
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  starting: boolean;
  position: string;
  onField: boolean;
}

export type EventType =
  | "Goal"
  | "Assist"
  | "Good Pass"
  | "Key Pass"
  | "Interception"
  | "Tackle Won"
  | "Recovery"
  | "Bad Pass"
  | "Lost Possession"
  | "Out Of Position"
  | "Missed Tackle"
  | "Missed Chance";

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  timestamp: number;
  type: EventType;
  notes?: string;
}

export const POSITIVE_EVENTS: EventType[] = [
  "Goal",
  "Assist",
  "Key Pass",
  "Interception",
  "Tackle Won",
  "Recovery",
  "Good Pass",
];

export const NEGATIVE_EVENTS: EventType[] = [
  "Bad Pass",
  "Lost Possession",
  "Out Of Position",
  "Missed Tackle",
  "Missed Chance",
];

export const EVENT_WEIGHTS: Record<EventType, number> = {
  Goal: 5,
  Assist: 3,
  "Key Pass": 2,
  Interception: 1,
  "Tackle Won": 1,
  Recovery: 1,
  "Good Pass": 0.2,
  "Bad Pass": -0.2,
  "Lost Possession": -0.5,
  "Missed Tackle": -1,
  "Out Of Position": -1,
  "Missed Chance": -1,
};

export const FORMATIONS: Record<string, { positions: string[]; label: string }> = {
  "4-4-2": {
    label: "4-4-2",
    positions: ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  },
  "4-3-3": {
    label: "4-3-3",
    positions: ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  },
  "4-2-3-1": {
    label: "4-2-3-1",
    positions: ["GK", "RB", "CB", "CB", "LB", "CDM", "CDM", "CAM", "CAM", "CAM", "ST"],
  },
  "3-5-2": {
    label: "3-5-2",
    positions: ["GK", "CB", "CB", "CB", "RM", "CM", "CM", "CM", "LM", "ST", "ST"],
  },
  "5-3-2": {
    label: "5-3-2",
    positions: ["GK", "RWB", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "ST", "ST"],
  },
};

export interface PlayerStats {
  playerId: string;
  goals: number;
  assists: number;
  positiveEvents: number;
  negativeEvents: number;
  rating: number;
  eventCounts: Record<EventType, number>;
}
