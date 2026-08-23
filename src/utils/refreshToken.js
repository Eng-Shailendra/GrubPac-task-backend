import crypto from "crypto";

export const generateRefreshTokenValue = () => {
    return crypto.randomBytes(64).toString("hex");
};

export const hashRefreshToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};