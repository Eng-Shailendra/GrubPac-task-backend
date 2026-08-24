import dotenv from "dotenv";
import { afterAll, beforeAll } from "vitest";

dotenv.config({
    path: process.env.TEST_ENV_FILE || ".env.test",
});

let prisma;
let emailQueue;

beforeAll(async () => {
    ({ default: prisma } = await import("../src/config/prisma.js"));
    ({ emailQueue } = await import("../src/jobs/queues/email-queue.js"));

    if (typeof prisma?.$queryRaw === "function") {
        await prisma.$queryRaw`SELECT 1`;
    }

    if (typeof emailQueue?.waitUntilReady === "function") {
        await emailQueue.waitUntilReady();
    }
});

afterAll(async () => {
    if (typeof emailQueue?.close === "function") {
        await emailQueue.close();
    }

    if (typeof prisma?.$disconnect === "function") {
        await prisma.$disconnect();
    }
});