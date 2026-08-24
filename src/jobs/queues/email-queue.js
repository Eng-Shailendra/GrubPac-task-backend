import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const emailQueue = new Queue("email-notifications", {
    connection: redis,

    defaultJobOptions: {
        attempts: 4,

        backoff: {
            type: "exponential",
            delay: 1000,
        },

        // Keep completed jobs for 1 hour.
        removeOnComplete: {
            age: 60 * 60,
        },

        // Keep failed jobs so GET /jobs/:id can inspect them.
        removeOnFail: false,
    },
});