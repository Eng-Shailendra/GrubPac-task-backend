import jwt from "jsonwebtoken";

const access_secret = process.env.JWT_ACCESS_SECRET;
const refresh_secret = process.env.JWT_REFRESH_SECRET;


if (!access_secret || !refresh_secret) {
    throw new Error("JWT secrets are not configured");
}


export const generateAccessToken = (payload) => {
    return jwt.sign(payload, access_secret, {
        expiresIn: "15m",
    });
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, refresh_secret, {
        expiresIn: "7d",
    });
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, access_secret);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, refresh_secret);
};