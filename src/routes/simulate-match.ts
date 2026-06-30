import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { simulateMatch } from "../engine/match-engine";
import type { Team } from "../engine/types";

const router = Router();

const PositionSchema = z.enum(["GK","CB","LB","RB","LWB","RWB","CDM","CM","CAM","LM","RM","LW","RW","ST","CF"]);
const TacticSchema = z.enum(["attacking","balanced","defensive","counter"]);
const PlayerSchema = z.object({
  name: z.string().min(1).max(80),
  position: PositionSchema,
  rating: z.number().int().min(1).max(99),
});
const TeamSchema = z.object({
  name: z.string().min(1).max(100),
  formation: z.string().min(3).max(20),
  tactic: TacticSchema,
  players: z.array(PlayerSchema).min(3).max(25)
    .refine((p) => p.some((x) => x.position === "GK"), { message: "Need at least one GK" })
    .refine((p) => p.filter((x) => x.position === "GK").length <= 3, { message: "Max 3 GKs" }),
});
const SimulateMatchInput = z.object({ homeTeam: TeamSchema, awayTeam: TeamSchema });

router.post("/simulate-match", (req: Request, res: Response) => {
  const parsed = SimulateMatchInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = simulateMatch(parsed.data.homeTeam as Team, parsed.data.awayTeam as Team);
  res.json(result);
});

export default router;
