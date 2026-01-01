import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./auth/routes.js";
import scenariosRoutes from "./scenarios/routes.js";
import sessionsRoutes from "./sessions/routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/scenarios", scenariosRoutes);
app.use("/sessions", sessionsRoutes);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on :${port}`));
