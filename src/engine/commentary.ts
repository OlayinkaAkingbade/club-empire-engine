import type { EventType } from "./types";
type CT = (player: string | null, team: string, minute: number) => string;
const templates: Partial<Record<EventType, CT[]>> = {
  goal: [
    (p,t,m) => `GOAL! ${p} slots it home for ${t}! The net ripples and the crowd erupts! ${m}'`,
    (p,t,m) => `GOAL! What a finish from ${p}! ${t} take the lead! ${m}'`,
    (p,t,m) => `GOAL! ${p} makes no mistake from close range! ${t} are ahead! ${m}'`,
    (p,t,m) => `GOAL! A stunning strike from ${p}! ${t} fans are on their feet! ${m}'`,
    (p,t,m) => `GOAL! Clinical finish by ${p}! ${t} hit the back of the net! ${m}'`,
    (p,t,m) => `GOAL! The keeper had no chance! ${p} buries it for ${t}! ${m}'`,
  ],
  own_goal: [
    (p,t,m) => `OWN GOAL! Disaster for ${t} — ${p} turns it into their own net! ${m}'`,
    (p,t,m) => `OWN GOAL! Unfortunate deflection off ${p} — ${t} have handed the opposition a gift! ${m}'`,
  ],
  shot_saved: [
    (p,t) => `${p} drives a fierce effort but the keeper pulls off a brilliant save! ${t} go close.`,
    (p,t) => `${p} tests the goalkeeper but can't find the net. Good hands from the keeper to deny ${t}.`,
    (p,t) => `Great chance for ${t}! ${p} fires in a powerful shot — tipped wide!`,
    (p,t) => `${p} unleashes a thunderbolt — the keeper dives full length to push it round the post for ${t}!`,
  ],
  shot_missed: [
    (p,t) => `${p} blazes over from a good position! ${t} will be disappointed.`,
    (p,t) => `So close! ${p}'s header drifts just wide of the post for ${t}.`,
    (p,t) => `${p} skies it! The opportunity goes begging for ${t}.`,
    (p,t) => `${p} pulls the trigger but the effort flies wide left. ${t} need to be sharper in front of goal.`,
  ],
  shot_blocked: [
    (p,t) => `${p} tries to sneak it through but it's blocked! ${t} see their chance snuffed out.`,
    (p,t) => `Blocked! ${p}'s powerful drive is deflected away by a brave defender. ${t} appeal for handball.`,
    (p,t) => `${p} gets the shot away for ${t} but it's blocked — corner kick!`,
  ],
  foul: [
    (p,t) => `${p} brings down his man — the referee whistles. Free kick to the opposition. ${t} warned.`,
    (p,t) => `Clumsy challenge from ${p}! The referee doesn't hesitate — free kick awarded.`,
    (p,t) => `${p} lunges in and the referee is on it immediately. Free kick for the opposition against ${t}.`,
  ],
  yellow_card: [
    (p,t) => `YELLOW CARD! ${p} goes into the referee's book. ${t} down to ten if he's not careful.`,
    (p,t) => `The referee reaches for his pocket — ${p} shown a yellow card. ${t} will need to manage this.`,
  ],
  red_card: [
    (p,t) => `RED CARD! ${p} is given his marching orders! ${t} are down to ten men — this changes everything!`,
    (p,t) => `Shocking moment — ${p} has been sent off! The referee shows straight red! ${t} in big trouble.`,
  ],
  offside: [
    (p,t) => `The flag goes up — ${p} caught offside. ${t}'s effort disallowed.`,
    (p,t) => `${p} was in an offside position. The referee agrees with his assistant — no goal for ${t}.`,
  ],
  corner: [
    (p,t) => `Corner kick for ${t}. ${p} steps up to deliver...`,
    (p,t) => `${t} win a corner. ${p} swings it in but it's headed clear.`,
  ],
  penalty_goal: [
    (p,t,m) => `PENALTY GOAL! ${p} sends the keeper the wrong way! ${t} convert from the spot! ${m}'`,
    (p,t,m) => `PENALTY GOAL! Ice in the veins — ${p} slots the penalty away calmly! ${t} take the lead! ${m}'`,
  ],
  penalty_missed: [
    (p,t,m) => `PENALTY MISSED! ${p} steps up... and blazes it over the bar! Incredible miss for ${t}! ${m}'`,
    (p,t,m) => `PENALTY SAVED! ${p}'s spot kick is kept out! ${t} can't believe it! ${m}'`,
  ],
  substitution: [
    (p,t) => `Substitution for ${t} — ${p} makes way. Fresh legs on the pitch.`,
    (p,t) => `Change for ${t}: ${p} is withdrawn. The manager looking to freshen things up.`,
  ],
  kickoff: [
    (_p,t) => `The referee blows his whistle — ${t} get the match underway!`,
    (_p,t) => `We're off! ${t} kick off on what promises to be a thrilling contest.`,
  ],
  half_time: [
    () => `HALF TIME! The referee brings the first half to a close. Both sides head to the dressing rooms.`,
    () => `That's half time! Forty-five minutes played — let's see what adjustments the managers make.`,
  ],
  full_time: [
    () => `FULL TIME! The final whistle blows! What a match!`,
    () => `FULL TIME! The referee ends the game! Club Empire football at its finest!`,
  ],
};

export function getCommentary(type: EventType, player: string|null, team: string, minute: number): string {
  const pool = templates[type];
  if (!pool || pool.length === 0) return `${minute}' — ${team}${player ? ` (${player})` : ""}: ${type.replace(/_/g," ")}.`;
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(player ?? "Unknown", team, minute);
}

const atmosphereSnippets = [
  "The crowd is growing restless as both sides struggle to break the deadlock.",
  "There's a real intensity about this match — neither team willing to give an inch.",
  "The stadium is buzzing with anticipation.",
  "The fans are making themselves heard — this atmosphere is electric.",
  "The manager is on his feet in the technical area, barking instructions.",
  "Both sets of supporters are in full voice.",
  "The pace of this match is relentless — both teams going at it.",
  "A tactical battle developing here in the middle of the park.",
  "Club Empire football doesn't get much better than this.",
];

export function getAtmosphereSnippet(): string {
  return atmosphereSnippets[Math.floor(Math.random() * atmosphereSnippets.length)];
}
