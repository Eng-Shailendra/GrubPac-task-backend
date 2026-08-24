import bcrypt from "bcrypt";
import prisma from "../config/prisma.js"
import { loginService, logoutUserService, refreshAccessToken, registerService } from "../services/auth-services.js";

export const register = async (req, res) => {
    try {
        const { name, email, password, organizationName } = req.body;

        if (!name || !email || !password || !organizationName) {
            return res.status(400).json({
                success: false,
                message: "name, email, password and organizationName are required",
            });
        }

        const result = await register({ name, email, password, organizationName })

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
            },
            organization: {
                id: result.organization.id,
                name: result.organization.name,
            },
            role: result.membership.role,
        });

    } catch (err) {
        console.log(err)
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const login = async (req, res) => {

    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({
                message: "email and password are required",
            });
        }
        const result = await loginService({ email, password })


        res.status(200).json({
            success: true,
            result,
        });
    } catch (err) {
        console.log(err)
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const result = await refreshAccessToken(refreshToken);

        return res.status(200).json(result);
    } catch (err) {
        console.error(err);

        if (err.statusCode) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        await logoutUserService(refreshToken);

        res.status(200).json({
            success: true,
            message: "logout successful",
        });
    } catch (err) {
        console.log(err)
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

};
