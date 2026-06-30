export type Position = "GK"|"CB"|"LB"|"RB"|"LWB"|"RWB"|"CDM"|"CM"|"CAM"|"LM"|"RM"|"LW"|"RW"|"ST"|"CF";
export type Tactic = "attacking"|"balanced"|"defensive"|"counter";

export interface Player { name: string; position: Position; rating: number; }
export interface Team { name: string; formation: string; tactic: Tactic; players: Player[]; }
export interface MatchInput { homeTeam: Team; awayTeam: Team; }

export type EventType = "goal"|"own_goal"|"shot_saved"|"shot_missed"|"shot_blocked"|"yellow_card"|"red_card"|"foul"|"offside"|"corner"|"penalty_missed"|"penalty_goal"|"substitution"|"kickoff"|"half_time"|"full_time";

export interface MatchEvent { minute: number; type: EventType; team: "home"|"away"|null; player: string|null; commentary: string; }
export interface TeamStats { shots: number; shotsOnTarget: number; possession: number; fouls: number; yellowCards: number; redCards: number; corners: number; }
export interface MatchResult { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; winner: "home"|"away"|"draw"; events: MatchEvent[]; stats: { home: TeamStats; away: TeamStats; }; }
