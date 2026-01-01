import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { orgId } = req.auth!;
  const scenarios = await prisma.scenario.findMany({
    where: { active: true, OR: [{ orgId: orgId ?? null }, { orgId: null }] },
    select: { id: true, scenarioId: true, version: true, title: true, active: true, updatedAt: true },
    orderBy: [{ scenarioId: "asc" }, { version: "desc" }]
  });
  res.json({ scenarios });
});

router.get("/:scenarioId", requireAuth, async (req, res) => {
  const { orgId } = req.auth!;
  const scenarioId = req.params.scenarioId;
  const version = (req.query.version as string | undefined) ?? undefined;

  const s = await prisma.scenario.findFirst({
    where: {
      scenarioId,
      ...(version ? { version } : {}),
      active: true,
      OR: [{ orgId: orgId ?? null }, { orgId: null }]
    },
    orderBy: version ? undefined : { version: "desc" },
    select: { id: true, scenarioId: true, version: true, title: true, json: true, updatedAt: true }
  });

  if (!s) return res.status(404).json({ error: "scenario_not_found" });
  res.json({ scenario: s });
});

export default router;
