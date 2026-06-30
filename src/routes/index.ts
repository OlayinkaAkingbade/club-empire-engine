import { Router } from "express";
import healthRouter from "./health";
import simulateMatchRouter from "./simulate-match";

const router = Router();
router.use(healthRouter);
router.use(simulateMatchRouter);

export default router;
