import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        message: "Too many authentication requests. Please try again later.",
    },
    handler: (req, res) => {
        res.status(400).json({
            message: "Too many authentication requests. Please try again later.",
        });
    },
})