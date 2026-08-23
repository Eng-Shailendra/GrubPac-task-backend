import prisma from "../config/prisma.js";

export const getMembers = async (organizationId) => {
    return await prisma.orgMember.findMany({
        where: {
            organizationId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                }
            }
        },
        orderBy: {
            id: "asc"
        }
    });
}

export const updateMemberRole = async ({ memberId, organizationId, role }) => {
    if (!["org_admin", "member"].includes(role)) {
        const err = new Error("Invalid role");
        err.statusCode = 400;
        return err;
    }

    const member = await prisma.orgMember.findUnique({
        where: {
            id: memberId,
        },
    });

    if (!member) {
        const error = new Error("Member not found");
        error.statusCode = 404;
        throw error;
    }

    if (member.organizationId !== organizationId) {
        const error = new Error("Forbidden");
        error.statusCode = 403;
        throw error;
    }
    return await prisma.orgMember.update({
        where: {
            id: memberId,
        },
        data: {
            role,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

export const removeMember = async (memberId, organizationId, requestingUserId) => {
    
    const member = await prisma.orgMember.findUnique({
        where: {
            id: memberId,
        },
    });

    if (!member) {
        const error = new Error("Member not found");
        error.statusCode = 404;
        throw error;
    }

    if (member.organizationId !== organizationId) {
        const error = new Error("Forbidden");
        error.statusCode = 403;
        throw error;
    }

    // Don't allow an admin to remove themselves.
    if (member.userId === requestingUserId) {
        const error = new Error("You cannot remove yourself");
        error.statusCode = 400;
        throw error;
    }

    await prisma.orgMember.delete({
        where: {
            id: memberId,
        },
    });
};