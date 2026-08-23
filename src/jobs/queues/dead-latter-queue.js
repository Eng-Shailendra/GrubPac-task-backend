import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const deadLetterQueue = new Queue(
    "email-dead-letter",
    {
        connection: redis,
        defaultJobOptions: {
            removeOnComplete: false,
            removeOnFail: false,
        },
    }
);