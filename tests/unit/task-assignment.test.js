import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, queueMock } = vi.hoisted(() => ({
    prismaMock: {
        task: { findUnique: vi.fn() },
        orgMember: { findUnique: vi.fn() },
        taskAssignment: {
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
    },
    queueMock: {
        add: vi.fn(),
    },
}));

vi.mock("../../src/config/prisma.js", () => ({ default: prismaMock }));
vi.mock("../../src/jobs/queues/email-queue.js", () => ({ emailQueue: queueMock }));

import { assignUserToTaskService } from "../../src/services/task-services.js";

describe("task assignment validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects a task from another organization", async () => {
        prismaMock.task.findUnique.mockResolvedValue({
            id: 1,
            deletedAt: null,
            project: { organizationId: 999 },
        });

        await expect(
            assignUserToTaskService(1, 2, 100)
        ).rejects.toMatchObject({
            statusCode: 403,
            code: "FORBIDDEN",
        });

        expect(prismaMock.orgMember.findUnique).not.toHaveBeenCalled();
    });

    it("rejects an assignee outside the organization", async () => {
        prismaMock.task.findUnique.mockResolvedValue({
            id: 1,
            deletedAt: null,
            project: { organizationId: 100 },
        });
        prismaMock.orgMember.findUnique.mockResolvedValue(null);

        await expect(
            assignUserToTaskService(1, 2, 100)
        ).rejects.toMatchObject({
            statusCode: 400,
            code: "INVALID_ASSIGNEE",
        });
    });

    it("rejects duplicate assignment", async () => {
        prismaMock.task.findUnique.mockResolvedValue({
            id: 1,
            deletedAt: null,
            project: { organizationId: 100 },
        });
        prismaMock.orgMember.findUnique.mockResolvedValue({ id: 5 });
        prismaMock.taskAssignment.findUnique.mockResolvedValue({ id: 9 });

        await expect(
            assignUserToTaskService(1, 2, 100)
        ).rejects.toMatchObject({
            statusCode: 409,
            code: "ALREADY_ASSIGNED",
        });
    });

    it("creates an assignment and enqueues a job", async () => {
        prismaMock.task.findUnique.mockResolvedValue({
            id: 1,
            deletedAt: null,
            project: { organizationId: 100 },
        });
        prismaMock.orgMember.findUnique.mockResolvedValue({ id: 5 });
        prismaMock.taskAssignment.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 10,
                taskId: 1,
                userId: 2,
                user: { id: 2, name: "Member", email: "member@test.local" },
            });
        prismaMock.taskAssignment.create.mockResolvedValue({
            id: 10,
            taskId: 1,
            userId: 2,
        });
        queueMock.add.mockResolvedValue({ id: "job-123" });

        const result = await assignUserToTaskService(1, 2, 100);

        expect(prismaMock.taskAssignment.create).toHaveBeenCalledWith({
            data: { taskId: 1, userId: 2 },
        });
        expect(queueMock.add).toHaveBeenCalledWith("task-assigned", {
            assignmentId: 10,
            taskId: 1,
            userId: 2,
        });
        expect(result.id).toBe(10);
    });
});
