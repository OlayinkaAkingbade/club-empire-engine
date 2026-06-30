import { Router } from "express";
const router = Router();
router.get("/healthz", (_req, res) => { res.json({ status: "ok", game: "Club Empire" }); });
export default router;
