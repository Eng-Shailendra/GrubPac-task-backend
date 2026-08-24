import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT || 10),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication requests, please try again later",
    },
});