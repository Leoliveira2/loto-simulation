import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { AppendEventsBodySchema, CompleteSessionBodySchema, StartSessionBodySchema } from "@loto/shared";

import { EventType, SessionStatus } from "@prisma/client";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const parsed = StartSessionBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });

  const { userId, orgId } = req.auth!;
  const { scenarioId, scenarioVersion, scenarioDbId } = parsed.data;

  const scenarioDb = scenarioDbId
    ? await prisma.scenario.findFirst({ where: { id: scenarioDbId } })
    : await prisma.scenario.findFirst({
        where: { scenarioId, version: scenarioVersion, active: true, OR: [{ orgId: orgId ?? null }, { orgId: null }] }
      });

  const session = await prisma.session.create({
    data: {
      userId,
      orgId: orgId ?? null,
      scenarioId,
      scenarioVersion,
      scenarioDbId: scenarioDb?.id ?? null,
      status: "IN_PROGRESS"
    },
    select: { id: true, status: true, startedAt: true, scenarioId: true, scenarioVersion: true }
  });

  res.status(201).json({ session });
});

router.post("/:id/events", requireAuth, async (req, res) => {
  const parsed = AppendEventsBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });

  const { userId, orgId } = req.auth!;
  const sessionId = req.params.id;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, OR: [{ orgId: orgId ?? null }, { orgId: null }] },
    select: { id: true, status: true }
  });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  if (session.status !== "IN_PROGRESS") return res.status(409).json({ error: "session_not_active", status: session.status });

  const incoming = parsed.data.events;
  const ids = incoming.map((e) => e.eventId);

  const existing = await prisma.event.findMany({
    where: { sessionId, clientEventId: { in: ids } },
    select: { clientEventId: true }
  });
  const existingSet = new Set(existing.map((e) => e.clientEventId));

  const toCreate = incoming
    .filter((e) => !existingSet.has(e.eventId))
    .map((e) => ({
      sessionId,
      clientEventId: e.eventId,
      ts: new Date(e.ts),
      type: e.type as EventType,
      payload: e.payload
    }));

  if (toCreate.length > 0) await prisma.event.createMany({ data: toCreate });

  res.status(201).json({ ok: true, inserted: toCreate.length, ignored: incoming.length - toCreate.length });
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  const parsed = CompleteSessionBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });

  const { userId, orgId } = req.auth!;
  const sessionId = req.params.id;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, OR: [{ orgId: orgId ?? null }, { orgId: null }] },
    select: { id: true, status: true }
  });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const status = (parsed.data.status ?? "COMPLETED") as SessionStatus;

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status,
      endedAt: new Date(),
      overallScore: parsed.data.overallScore,
      maturityLevel: parsed.data.maturityLevel,
      dimensionScores: parsed.data.dimensionScores,
      criticalFails: parsed.data.criticalFails
    },
    select: { id: true, status: true, startedAt: true, endedAt: true, overallScore: true, maturityLevel: true, scenarioId: true, scenarioVersion: true }
  });

  res.json({ session: updated });
});

router.get("/me/history", requireAuth, async (req, res) => {
  const { userId } = req.auth!;
  const take = Math.min(Number(req.query.take ?? 20), 100);
  const cursor = req.query.cursor as string | undefined;

  const sessions = await prisma.session.findMany({
    where: { userId, status: { in: ["COMPLETED", "FAILED", "ABORTED"] } },
    orderBy: { startedAt: "desc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, scenarioId: true, scenarioVersion: true, status: true, startedAt: true, endedAt: true, overallScore: true, maturityLevel: true }
  });

  const nextCursor = sessions.length === take ? sessions[sessions.length - 1].id : null;
  res.json({ sessions, nextCursor });
});

router.get("/:id", requireAuth, async (req, res) => {
  const { userId, orgId } = req.auth!;
  const sessionId = req.params.id;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, OR: [{ orgId: orgId ?? null }, { orgId: null }] },
    select: { id: true, scenarioId: true, scenarioVersion: true, status: true, startedAt: true, endedAt: true, overallScore: true, maturityLevel: true, dimensionScores: true, criticalFails: true }
  });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const events = await prisma.event.findMany({
    where: { sessionId },
    orderBy: { ts: "asc" },
    select: { id: true, clientEventId: true, ts: true, type: true, payload: true }
  });

  res.json({ session, events });
});

export default router;
