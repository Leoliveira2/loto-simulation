import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function upsertScenario(orgId: string, scenarioRelPath: string) {
  const scenarioPath = path.resolve(process.cwd(), scenarioRelPath);
  if (!fs.existsSync(scenarioPath)) throw new Error(`Arquivo do cenário não encontrado: ${scenarioPath}`);

  const scenarioJson = JSON.parse(fs.readFileSync(scenarioPath, "utf-8"));
  const scenarioId = scenarioJson.scenarioId;
  const version = scenarioJson.version;
  const title = scenarioJson.title;

  await prisma.scenario.upsert({
    where: { orgId_scenarioId_version: { orgId, scenarioId, version } },
    update: { title, json: scenarioJson, active: true },
    create: { orgId, scenarioId, version, title, json: scenarioJson, active: true }
  });

  return { scenarioId, version, title };
}

async function main() {
  const org = await prisma.org.upsert({
    where: { name: "Demo Org" },
    update: {},
    create: { name: "Demo Org", plan: "trial" }
  });

  const email = "admin@demo.com";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Admin", passwordHash, role: "ADMIN", orgId: org.id }
  });

  // Paths relativos a apps/api (cwd ao rodar seed)
  const s1 = await upsertScenario(org.id, "../../packages/scenarios/loto-eletrico-motor-480v/1.0.0.json");
  const s2 = await upsertScenario(org.id, "../../packages/scenarios/loto-eletrico-mcc-multiplas-fontes/1.0.0.json");

  console.log("Seed concluído.");
  console.log("Org:", org.name);
  console.log("User:", email, "senha:", password);
  console.log("Scenarios:", [s1, s2]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
