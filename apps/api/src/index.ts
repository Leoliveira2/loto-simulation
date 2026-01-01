import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./auth/routes.js";
import scenariosRoutes from "./scenarios/routes.js";
import sessionsRoutes from "./sessions/routes.js";

dotenv.config();

// ============================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

console.log("✅ Environment variables validated");

// ============================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================
const app = express();

// CORS dinâmico baseado em ambiente
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Em produção, validar origin
      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      } else {
        // Em desenvolvimento, permitir tudo
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (_, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ============================================
// ROTAS
// ============================================
app.use("/auth", authRoutes);
app.use("/scenarios", scenariosRoutes);
app.use("/sessions", sessionsRoutes);

// ============================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error:", err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => {
  console.log(`🚀 API listening on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });

  // Forçar shutdown após 10 segundos
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
