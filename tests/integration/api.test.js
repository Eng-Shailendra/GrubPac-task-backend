import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import prisma from "../../src/config/prisma.js";
import { emailQueue } from "../../src/jobs/queues/email-queue.js";
import { resetDatabase, createTestData } from "../helpers/db.js";

let data;

async function loginAs(email) {
    const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "Password@123" });

    expect(response.status).toBe(200);
    return response.body.result.accessToken;
}

beforeAll(async () => {
    await resetDatabase();
});

beforeEach(async () => {
    await resetDatabase();
    data = await createTestData();
    await emailQueue.drain(true);
});

describe("authentication integration", () => {
    it("logs in and returns an access and refresh token", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "admin-a@test.local",
                password: "Password@123",
            });

        expect(response.status).toBe(200);
        expect(response.body.result.accessToken).toEqual(expect.any(String));
        expect(response.body.result.refreshToken).toEqual(expect.any(String));
        expect(response.body.result.organization.id).toBe(data.orgA.id);
    });

    it("rejects invalid credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "admin-a@test.local",
                password: "wrong-password",
            });

        expect(response.status).toBe(401);
    });

    it("rejects unauthenticated task access", async () => {
        const response = await request(app).get("/api/tasks");
        expect(response.status).toBe(401);
    });
});

describe("task CRUD integration", () => {
    it("creates, reads, updates and deletes a task", async () => {
        const token = await loginAs("admin-a@test.local");

        const create = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                projectId: data.projectA.id,
                title: "Integration task",
                description: "Created by integration test",
                priority: "high",
            });

        expect(create.status).toBe(201);
        const taskId = create.body.data.id;

        const get = await request(app)
            .get(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(get.status).toBe(200);
        expect(get.body.data.id).toBe(taskId);

        const update = await request(app)
            .patch(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated integration task", status: "done" });

        expect(update.status).toBe(200);
        expect(update.body.data.title).toBe("Updated integration task");
        expect(update.body.data.status).toBe("done");

        const remove = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(remove.status).toBe(200);

        const deletedRead = await request(app)
            .get(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deletedRead.status).toBe(404);
    });

    it("returns paginated tasks", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .get("/api/tasks?page=1&limit=1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(1);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.total).toBeGreaterThanOrEqual(1);
    });
});

describe("multi-tenant isolation", () => {
    it("blocks cross-tenant task read with 403", async () => {
        const tokenA = await loginAs("admin-a@test.local");

        const response = await request(app)
            .get(`/api/tasks/${data.taskB.id}`)
            .set("Authorization", `Bearer ${tokenA}`);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("FORBIDDEN");
    });

    it("blocks cross-tenant task update with 403", async () => {
        const tokenA = await loginAs("admin-a@test.local");

        const response = await request(app)
            .patch(`/api/tasks/${data.taskB.id}`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ title: "Attack" });

        expect(response.status).toBe(403);
    });

    it("blocks cross-tenant task deletion with 403", async () => {
        const tokenA = await loginAs("admin-a@test.local");

        const response = await request(app)
            .delete(`/api/tasks/${data.taskB.id}`)
            .set("Authorization", `Bearer ${tokenA}`);

        expect(response.status).toBe(403);

        const unchanged = await prisma.task.findUnique({
            where: { id: data.taskB.id },
        });
        expect(unchanged.deletedAt).toBeNull();
    });

    it("blocks creating a task in another tenant's project", async () => {
        const tokenA = await loginAs("admin-a@test.local");

        const response = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({
                projectId: data.projectB.id,
                title: "Cross tenant task",
            });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("FORBIDDEN");
    });

    it("blocks assigning a cross-tenant task", async () => {
        const tokenA = await loginAs("admin-a@test.local");

        const response = await request(app)
            .post(`/api/tasks/${data.taskB.id}/assign`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ userId: data.users[1].id });

        expect(response.status).toBe(403);
    });
});

describe("validation and error scenarios", () => {
    it("returns 400 for missing task title", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ projectId: data.projectA.id });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("INVALID_TASK_TITLE");
    });

    it("returns 400 for an invalid task id", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .get("/api/tasks/not-a-number")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("INVALID_TASK_ID");
    });

    it("returns 404 for a nonexistent task", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .get("/api/tasks/999999")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe("TASK_NOT_FOUND");
    });

    it("returns 400 when assigning an invalid user id", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .post(`/api/tasks/${data.taskA.id}/assign`)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: "invalid" });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("INVALID_USER_ID");
    });
});

describe("queue integration", () => {
    it("creates a BullMQ job when task assignment succeeds", async () => {
        const token = await loginAs("admin-a@test.local");

        const response = await request(app)
            .post(`/api/tasks/${data.taskA.id}/assign`)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: data.users[1].id });

        expect(response.status).toBe(201);

        const jobs = await emailQueue.getJobs(["waiting", "delayed", "active", "completed", "failed"]);
        const job = jobs.find(
            (item) =>
                item.name === "task-assigned" &&
                item.data.taskId === data.taskA.id
        );

        expect(job).toBeDefined();
        expect(job.data.userId).toBe(data.users[1].id);
    });
});
