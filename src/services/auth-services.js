import bcrypt from "bcrypt";
import prisma from '../config/prisma.js'
import { generateAccessToken, } from "../utils/jwt.js";
import { generateRefreshTokenValue, hashRefreshToken } from "../utils/refreshToken.js";




export const registerService = async ({
    name,
    email,
    password,
    organizationName,
}) => {

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: {
                name: organizationName,
            },
        });
        const user = await tx.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });
        const membership = await tx.orgMember.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                role: "org_admin",
            }
        });
        return {
            user,
            organization,
            membership,
        };
    })
    return result;
}


export const loginService = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
        include: {
            memberships: {
                include: {
                    organization: true,
                }
            }
        }
    });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const passwordvalid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordvalid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    if (user.memberships.length === 0) {
        const error = new Error("User does not belong to an organization");
        error.statusCode = 403;
        throw error;
    }

    // For now, use the user's first organization membership.
    const membership = user.memberships[0];

    const accessToken = generateAccessToken({
        userId: user.id,
        organizationId: membership.organizationId,
        role: membership.role,
    });
    const refreshToken = generateRefreshTokenValue();
    const tokenHash = hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt
        },
    });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        organization: {
            id: membership.organizationId,
            name: membership.organization.name,
        },
        role: membership.role,
    };
}

export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 400;
        throw error;
    }
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
        where: {
            tokenHash,
        },
        include: {
            user: {
                include: {
                    memberships: {
                        include: {
                            organization: true,
                        }
                    }
                }
            }
        }
    })

    if (!storedToken) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    if (storedToken.revokedAt) {
        const error = new Error("Refresh token has been revoked");
        error.statusCode = 401;
        throw error;
    }

    if (storedToken.expiresAt <= new Date()) {
        const error = new Error("Refresh token has expired");
        error.statusCode = 401;
        throw error;
    }

    const membership = storedToken.user.memberships[0];

    if (!membership) {
        const error = new Error("User does not belong to an organization");
        error.statusCode = 403;
        throw error;
    }

    const accessToken = generateAccessToken({
        userId: storedToken.user.id,
        organizationId: membership.organizationId,
        role: membership.role,
    });

    // Generate new refresh token 
    const newRefreshToken = generateRefreshTokenValue();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    const newExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Rotate refresh token atomically
    await prisma.$transaction([
        prisma.refreshToken.update({
            where: {
                id: storedToken.id,
            },
            data: {
                revokedAt: new Date(),
            },
        }),
        prisma.refreshToken.create({
            data: {
                tokenHash: newTokenHash,
                userId: storedToken.user.id,
                expiresAt: newExpiresAt,
            },
        }),
    ]);

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
}

export const logoutUserService = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 400;
        throw error;
    }
    const tokenHash = hashRefreshToken(refreshToken);


    const storedToken = await prisma.refreshToken.findUnique({
        where: {
            tokenHash,
        }
    })


    if (!storedToken) {
        return;
    }

    if (storedToken.revokedAt) {
        return
    }

    await prisma.refreshToken.update({
        where: {
            id: storedToken.id,
        },
        data: {
            revokedAt: new Date(),
        }

    });

}