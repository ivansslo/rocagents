import express from "express";
import { db } from "./db";

const router = express.Router();

router.get("/capabilities", (req, res) => {
  try { res.json(db.getSelfCapabilities()); } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/capabilities", (req, res) => {
  try {
    const { name, codeSnippet, purpose, category } = req.body;
    if (!name || !codeSnippet) return res.status(400).json({ error: "Name and codeSnippet required" });
    const id = db.saveSelfCapability(name, codeSnippet, purpose || '', category || 'general');
    res.json({ status: "success", id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/logs/:name", (req, res) => {
  try {
    const nameDecoded = decodeURIComponent(req.params.name);
    const logs = db.getLogs().filter(l => 
      (l.toolName === "self_develop_capability" && (l.args?.name === nameDecoded || l.args?.name === req.params.name)) ||
      (l.args?.capabilityName === nameDecoded || l.args?.capabilityName === req.params.name)
    );
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/routines/:name/history", (req, res) => {
  try {
    const nameDecoded = decodeURIComponent(req.params.name);
    const logs = db.getLogs().filter(l => 
      (l.toolName === "self_develop_capability" && (l.args?.name === nameDecoded || l.args?.name === req.params.name)) ||
      (l.args?.capabilityName === nameDecoded || l.args?.capabilityName === req.params.name)
    );
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
