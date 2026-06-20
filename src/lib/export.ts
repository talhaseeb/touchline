import type { Match, MatchPlayer, Player, MatchEvent, Team } from "@/types";
import { calculatePlayerStats } from "./ratings";
import { POSITIVE_EVENTS } from "@/types";

interface ExportData {
  match: Match;
  opponent: Team;
  matchPlayers: MatchPlayer[];
  players: Player[];
  events: MatchEvent[];
}

export async function exportMatchPDF(data: ExportData) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const playerMap = Object.fromEntries(data.players.map((p) => [p.id, p]));

  // Header
  doc.setFillColor(22, 163, 74); // green
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TOUCHLINE", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Smarter decisions from the touchline.", 14, 22);

  // Match info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`vs ${data.opponent.name}`, 14, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${new Date(data.match.date).toLocaleDateString()}   Formation: ${data.match.formation}`, 14, 50);

  // Team stats
  const teamGoals = data.events.filter((e) => e.type === "Goal").length;
  const teamAssists = data.events.filter((e) => e.type === "Assist").length;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Team Summary", 14, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Goals: ${teamGoals}   Assists: ${teamAssists}   Total Events: ${data.events.length}`, 14, 70);

  // Player stats table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Player Statistics", 14, 82);

  const rows = data.matchPlayers.map((mp) => {
    const player = playerMap[mp.playerId];
    const stats = calculatePlayerStats(mp.playerId, data.events);
    return [
      player ? `#${player.jerseyNumber} ${player.firstName} ${player.lastName}` : "Unknown",
      mp.position,
      String(stats.goals),
      String(stats.assists),
      String(stats.positiveEvents),
      String(stats.negativeEvents),
      stats.rating.toFixed(1),
    ];
  }).sort((a, b) => parseFloat(b[6]) - parseFloat(a[6]));

  autoTable(doc, {
    startY: 86,
    head: [["Player", "Pos", "G", "A", "+Events", "-Events", "Rating"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Timeline
  const afterTable = (doc as any).lastAutoTable?.finalY ?? 150;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Match Timeline", 14, afterTable + 12);

  const timelineRows = [...data.events].reverse().map((ev) => {
    const player = playerMap[ev.playerId];
    const m = Math.floor(ev.timestamp / 60);
    const s = ev.timestamp % 60;
    return [
      `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      ev.type,
      player ? `${player.firstName} ${player.lastName}` : "Unknown",
    ];
  });

  autoTable(doc, {
    startY: afterTable + 16,
    head: [["Time", "Event", "Player"]],
    body: timelineRows,
    theme: "striped",
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`touchline-match-${data.match.id}.pdf`);
}

export function exportMatchCSV(data: Omit<ExportData, "opponent">) {
  const playerMap = Object.fromEntries(data.players.map((p) => [p.id, p]));

  const rows = [
    ["Time", "Event", "Player", "Position", "Type"],
    ...data.events.map((ev) => {
      const player = playerMap[ev.playerId];
      const mp = data.matchPlayers.find((m) => m.playerId === ev.playerId);
      const m = Math.floor(ev.timestamp / 60);
      const s = ev.timestamp % 60;
      return [
        `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        ev.type,
        player ? `${player.firstName} ${player.lastName}` : "Unknown",
        mp?.position ?? "",
        POSITIVE_EVENTS.includes(ev.type) ? "Positive" : "Negative",
      ];
    }),
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `touchline-events-${data.match.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
