import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const token = authHeader.split(" ")[1];
        console.log(token)

        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.userId,
            organizationId: payload.organizationId,
            role: payload.role,
        };
        next();

    } catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token",
        });
    }
}