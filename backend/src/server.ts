import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function start() {
  await prisma.$connect();
  console.log("PostgreSQL connected.");
  app.listen(env.PORT, () => console.log(`AAROGYAI API: http://localhost:${env.PORT}`));
}

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((error) => {
  console.error("Unable to start backend.", error);
  process.exit(1);
});
