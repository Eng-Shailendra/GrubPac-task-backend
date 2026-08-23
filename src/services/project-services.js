import prisma from "../config/prisma.js";

export const getProjectById = async (projectId, organizationId) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        }
    })

    if (!project) {
        const error = new Error("Project not found");
        error.statusCode = 404;
        throw error;
    }

    // The project must belong to the authenticated user's organization.
    if (project.organizationId !== organizationId) {
        const error = new Error("Forbidden");
        error.statusCode = 403;
        throw error;
    }


    return project;
}


export const deleteProject = async (projectId, organizationId) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project) {
        const error = new Error("Project not found");
        error.statusCode = 404;
        throw error;
    }

    // Prevent cross-tenant deletion
    if (project.organizationId !== organizationId) {
        const error = new Error("Forbidden");
        error.statusCode = 403;
        throw error;
    }

    await prisma.project.update({
        where: {
            id: projectId,
        },
        data: {
            deletedAt: new Date(),
        },
    });
};