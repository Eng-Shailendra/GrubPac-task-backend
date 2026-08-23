import { emailQueue } from "../jobs/queues/email-queue.js";

export const getJobStatus = async (jobId) => {
    const job = await emailQueue.getJob(jobId);

    if (!job) {
        return null;
    }

    let status = "pending";

    if (await job.isActive()) {
        status = "active";
    } else if (await job.isCompleted()) {
        status = "completed";
    } else if (await job.isFailed()) {
        status = "failed";
    }

    return {
        jobId: job.id,
        status,
        metadata: {
            name: job.name,
            data: job.data,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason || null,
            createdAt: new Date(job.timestamp),
        },
    };
};