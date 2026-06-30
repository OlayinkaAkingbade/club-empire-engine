import type { Team, Player, MatchEvent, MatchResult, TeamStats, Tactic, Position } from "./types";
import { getCommentary, getAtmosphereSnippet } from "./commentary";

function rand(): number { return Math.random(); }
function randInt(min: number, max: number): number { return Math.floor(rand() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }

const GK_POSITIONS:  Position[] = ["GK"];
const DEF_POSITIONS: Position[] = ["CB","LB","RB","LWB","RWB"];
const MID_POSITIONS: Position[] = ["CDM","CM","CAM","LM","RM"];
const ATK_POSITIONS: Position[] = ["LW","RW","ST","CF"];

function avgRating(players: Player[], positions: Position[]): number {
  const filtered = players.filter((p) => positions.includes(p.position));
  if (filtered.length === 0) return players.reduce((s,p) => s + p.rating, 0) / players.length;
  return filtered.reduce((s,p) => s + p.rating, 0) / filtered.length;
}

interface TacticModifier { attackMult: number; defenseMult: number; possessionBonus: number; }
const TACTIC_MODIFIERS: Record<Tactic, TacticModifier> = {
  attacking: { attackMult: 1.18, defenseMult: 0.88, possessionBonus:  4 },
  balanced:  { attackMult: 1.00, defenseMult: 1.00, possessionBonus:  0 },
  defensive: { attackMult: 0.85, defenseMult: 1.18, possessionBonus: -4 },
  counter:   { attackMult: 1.08, defenseMult: 1.05, possessionBonus: -6 },
};

interface TeamStrength { attack: number; midfield: number; defense: number; goalkeeping: number; overall: number; }
function calcStrength(team: Team): TeamStrength {
  const mod = TACTIC_MODIFIERS[team.tactic];
  const attack      = clamp(avgRating(team.players, ATK_POSITIONS) * mod.attackMult, 1, 99);
  const midfield    = avgRating(team.players, MID_POSITIONS);
  const defense     = clamp(avgRating(team.players, DEF_POSITIONS) * mod.defenseMult, 1, 99);
  const goalkeeping = avgRating(team.players, GK_POSITIONS);
  const overall     = attack*0.35 + midfield*0.25 + defense*0.28 + goalkeeping*0.12;
  return { attack, midfield, defense, goalkeeping, overall };
}

function calcPossession(hStr: TeamStrength, aStr: TeamStrength, hTactic: Tactic, aTactic: Tactic): number {
  const hMid = hStr.midfield + TACTIC_MODIFIERS[hTactic].possessionBonus;
  const aMid = aStr.midfield + TACTIC_MODIFIERS[aTactic].possessionBonus;
  return clamp(Math.round((hMid / (hMid + aMid)) * 100), 30, 70);
}

function scorer(team: Team): Player {
  const attackers = team.players.filter((p) => ATK_POSITIONS.includes(p.position));
  const mids      = team.players.filter((p) => MID_POSITIONS.includes(p.position));
  const pool      = attackers.length > 0 ? [...attackers, ...attackers, ...mids] : team.players;
  const total     = pool.reduce((s,p) => s + p.rating, 0);
  let roll = rand() * total;
  for (const p of pool) { roll -= p.rating; if (roll <= 0) return p; }
  return pool[pool.length - 1];
}

function cardRecipient(team: Team): Player {
  const defenders = team.players.filter((p) => DEF_POSITIONS.includes(p.position));
  const mids      = team.players.filter((p) => MID_POSITIONS.includes(p.position));
  return pick(defenders.length > 0 ? [...defenders, ...mids] : team.players);
}

function cornerTaker(team: Team): Player {
  const mids = team.players.filter((p) => MID_POSITIONS.includes(p.position));
  return pick(mids.length > 0 ? mids : team.players);
}

interface MinuteResult { events: MatchEvent[]; homeGoals: number; awayGoals: number; }

function simulateMinute(
  minute: number, homeTeam: Team, awayTeam: Team,
  homeStr: TeamStrength, awayStr: TeamStrength, homePossession: number,
  homeStats: TeamStats, awayStats: TeamStats, homeRedded: boolean, awayRedded: boolean,
): MinuteResult {
  const events: MatchEvent[] = [];
  let homeGoals = 0, awayGoals = 0;
  const homeAttacks   = rand() * 100 < homePossession;
  const attackingTeam = homeAttacks ? homeTeam : awayTeam;
  const defendingTeam = homeAttacks ? awayTeam : homeTeam;
  const attackingStr  = homeAttacks ? homeStr  : awayStr;
  const defendingStr  = homeAttacks ? awayStr  : homeStr;
  const side          = (homeAttacks ? "home" : "away") as "home" | "away";
  const atkStats      = homeAttacks ? homeStats : awayStats;
  const defStats      = homeAttacks ? awayStats : homeStats;
  const attackMult    = (homeAttacks && homeRedded) || (!homeAttacks && awayRedded) ? 0.80 : 1.0;
  const defenseMult   = (!homeAttacks && homeRedded) || (homeAttacks && awayRedded) ? 0.80 : 1.0;
  const attackFactor  = (attackingStr.attack  * attackMult)  / 100;
  const midFactor     =  attackingStr.midfield                / 100;
  const defFactor     = (defendingStr.defense * defenseMult) / 100;
  const gkFactor      =  defendingStr.goalkeeping             / 100;
  const shotChance    = clamp(0.08 + attackFactor*0.18 + midFactor*0.06 - defFactor*0.14, 0.05, 0.35);

  if (rand() < shotChance) {
    atkStats.shots++;
    const player = scorer(attackingTeam);
    if (rand() < 0.05) {
      defStats.corners++;
      events.push({ minute, type: "offside", team: side, player: player.name, commentary: getCommentary("offside", player.name, attackingTeam.name, minute) });
      return { events, homeGoals, awayGoals };
    }
    if (rand() < 0.14) {
      events.push({ minute, type: "shot_blocked", team: side, player: player.name, commentary: getCommentary("shot_blocked", player.name, attackingTeam.name, minute) });
      if (rand() < 0.4) {
        const taker = cornerTaker(attackingTeam);
        atkStats.corners++;
        events.push({ minute, type: "corner", team: side, player: taker.name, commentary: getCommentary("corner", taker.name, attackingTeam.name, minute) });
      }
      return { events, homeGoals, awayGoals };
    }
    const playerQuality  = player.rating / 99;
    const onTargetChance = clamp(0.35 + playerQuality*0.25, 0.3, 0.65);
    if (rand() < onTargetChance) {
      atkStats.shotsOnTarget++;
      if (rand() < 0.025) {
        const penGoalChance = clamp(0.72 + playerQuality*0.1 - gkFactor*0.08, 0.6, 0.88);
        if (rand() < penGoalChance) {
          events.push({ minute, type: "penalty_goal", team: side, player: player.name, commentary: getCommentary("penalty_goal", player.name, attackingTeam.name, minute) });
          if (homeAttacks) homeGoals++; else awayGoals++;
        } else {
          events.push({ minute, type: "penalty_missed", team: side, player: player.name, commentary: getCommentary("penalty_missed", player.name, attackingTeam.name, minute) });
        }
        return { events, homeGoals, awayGoals };
      }
      const goalChance = clamp(0.25 + attackFactor*0.22 - gkFactor*0.20 - defFactor*0.08, 0.08, 0.55);
      if (rand() < goalChance) {
        if (rand() < 0.03) {
          const defPool = defendingTeam.players.filter((p) => DEF_POSITIONS.includes(p.position));
          const ownPool = defPool.length > 0 ? defPool : defendingTeam.players;
          const og = pick(ownPool);
          events.push({ minute, type: "own_goal", team: side, player: og.name, commentary: getCommentary("own_goal", og.name, defendingTeam.name, minute) });
        } else {
          events.push({ minute, type: "goal", team: side, player: player.name, commentary: getCommentary("goal", player.name, attackingTeam.name, minute) });
        }
        if (homeAttacks) homeGoals++; else awayGoals++;
      } else {
        events.push({ minute, type: "shot_saved", team: side, player: player.name, commentary: getCommentary("shot_saved", player.name, attackingTeam.name, minute) });
      }
    } else {
      events.push({ minute, type: "shot_missed", team: side, player: player.name, commentary: getCommentary("shot_missed", player.name, attackingTeam.name, minute) });
      if (rand() < 0.25) {
        const taker = cornerTaker(attackingTeam);
        atkStats.corners++;
        events.push({ minute, type: "corner", team: side, player: taker.name, commentary: getCommentary("corner", taker.name, attackingTeam.name, minute) });
      }
    }
  }

  if (rand() < 0.08) {
    const fouler   = cardRecipient(defendingTeam);
    const foulSide = (homeAttacks ? "away" : "home") as "home" | "away";
    defStats.fouls++;
    events.push({ minute, type: "foul", team: foulSide, player: fouler.name, commentary: getCommentary("foul", fouler.name, defendingTeam.name, minute) });
    if (rand() < 0.20) {
      defStats.yellowCards++;
      events.push({ minute, type: "yellow_card", team: foulSide, player: fouler.name, commentary: getCommentary("yellow_card", fouler.name, defendingTeam.name, minute) });
      if (rand() < 0.04) {
        defStats.redCards++;
        events.push({ minute, type: "red_card", team: foulSide, player: fouler.name, commentary: getCommentary("red_card", fouler.name, defendingTeam.name, minute) });
      }
    }
  }
  return { events, homeGoals, awayGoals };
}

export function simulateMatch(homeTeam: Team, awayTeam: Team): MatchResult {
  const homeStr = calcStrength(homeTeam);
  const awayStr = calcStrength(awayTeam);
  const homePossessionBase = calcPossession(homeStr, awayStr, homeTeam.tactic, awayTeam.tactic);
  const homeStats: TeamStats = { shots:0, shotsOnTarget:0, possession:homePossessionBase,       fouls:0, yellowCards:0, redCards:0, corners:0 };
  const awayStats: TeamStats = { shots:0, shotsOnTarget:0, possession:100-homePossessionBase, fouls:0, yellowCards:0, redCards:0, corners:0 };
  const allEvents: MatchEvent[] = [];
  let homeScore = 0, awayScore = 0, homeRedded = false, awayRedded = false;
  const atmosphereMinutes = new Set([12,25,38,55,68,78]);

  function runMinutes(from: number, to: number) {
    for (let m = from; m <= to; m++) {
      if (homeStats.redCards > 0) homeRedded = true;
      if (awayStats.redCards > 0) awayRedded = true;
      const { events } = simulateMinute(m, homeTeam, awayTeam, homeStr, awayStr, homePossessionBase, homeStats, awayStats, homeRedded, awayRedded);
      for (const ev of events) {
        allEvents.push(ev);
        if (ev.type === "goal" || ev.type === "own_goal" || ev.type === "penalty_goal") {
          if (ev.team === "home") homeScore++; else awayScore++;
        }
      }
      if (atmosphereMinutes.has(m) && events.length === 0) {
        allEvents.push({ minute: m, type: "foul", team: null, player: null, commentary: `${m}' — ${getAtmosphereSnippet()}` });
      }
    }
  }

  allEvents.push({ minute:1, type:"kickoff", team:null, player:null, commentary: getCommentary("kickoff", null, homeTeam.name, 1) });
  runMinutes(1, 45);
  const htInjury = randInt(1, 4);
  runMinutes(46, 45 + htInjury);
  allEvents.push({ minute: 45+htInjury, type:"half_time", team:null, player:null, commentary: getCommentary("half_time", null, "", 45+htInjury) });
  runMinutes(46, 90);
  const ftInjury = randInt(2, 6);
  runMinutes(91, 90 + ftInjury);
  allEvents.push({ minute: 90+ftInjury, type:"full_time", team:null, player:null, commentary: getCommentary("full_time", null, "", 90+ftInjury) });

  const winner: "home"|"away"|"draw" = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";
  return { homeTeam: homeTeam.name, awayTeam: awayTeam.name, homeScore, awayScore, winner, events: allEvents, stats: { home: homeStats, away: awayStats } };
}
