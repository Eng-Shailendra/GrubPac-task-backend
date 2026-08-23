import ioredis from "ioredis";

const redis = new ioredis(
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
    {
        maxRetriesPerRequest: null
    }
);

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (error) => {
    console.error("Redis error:", error.message);
});

export default redis;