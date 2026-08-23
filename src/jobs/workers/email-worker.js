import { Worker } from "bullmq";

import redis from "../../config/redis.js";
import prisma from "../../config/prisma.js";
import { sendAssignmentEmail } from "../email/mock-email.js";
import { deadLetterQueue } from "../queues/dead-latter-queue.js";

const worker = new Worker(
    "email-notifications",

    async (job) => {
        console.log(`📨 Processing email job: ${job.id}`);

        const {
            assignmentId,
            taskId,
            userId,
        } = job.data;

        const assignment =
            await prisma.taskAssignment.findUnique({
                where: {
                    id: assignmentId,
                },
                include: {
                    user: true,
                    task: true,
                },
            });

        if (!assignment) {
            throw new Error(
                "Task assignment not found"
            );
        }

        await sendAssignmentEmail({
            email: assignment.user.email,
            userName: assignment.user.name,
            taskTitle: assignment.task.title,
        });

        return {
            assignmentId,
            taskId,
            userId,
            sent: true,
        };
    },

    {
        connection: redis,
    }
);

worker.on("completed", (job) => {
    console.log(
        `✅ Email job ${job.id} completed`
    );
});

worker.on("failed", async (job, err) => {
    if (!job) return;

    console.log(`❌ Email job ${job.id} failed: ${err.message}`);

    // Move the job to the dead-letter queue only
    // after all retry attempts have been exhausted.
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
        await deadLetterQueue.add(
            "failed-email",
            {
                originalJobId: job.id,
                originalJobName: job.name,
                originalData: job.data,
                failedReason: err.message,
                attemptsMade: job.attemptsMade,
                failedAt: new Date().toISOString(),
            },
            {
                removeOnComplete: false,
                removeOnFail: false,
            }
        );

        console.log(`☠️ Email job ${job.id} moved to dead-letter queue`);
    }
});

worker.on("error", (error) => {
    console.error(
        "Worker error:",
        error.message
    );
});

console.log("👷 Email worker started");