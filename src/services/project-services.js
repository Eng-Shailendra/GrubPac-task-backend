import prisma from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

export const createProjectService = async (organizationId, name, description) => {
    return prisma.project.create({
        data: {
            organizationId,
            name,
            description,
        },
    });
};

export const getProjectsService = async (organizationId, page, limit) => {
    const skip = (page - 1) * limit;

    const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({
            where: {
                organizationId,
                deletedAt: null,
            },
            orderBy: {
                id: "asc",
            },
            skip,
            take: limit,
        }),

        prisma.project.count({
            where: {
                organizationId,
                deletedAt: null,
            },
        }),
    ]);

    return {
        data: projects,
        total,
        page,
        limit,
    };
};

export const getProjectByIdService = async (projectId, organizationId) => {
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


export const deleteProjectService = async (projectId, organizationId) => {
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

export const updateProjectService = async (projectId, organizationId, data) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project) {
        throw new AppError(
            "Project not found",
            "PROJECT_NOT_FOUND",
            404
        );
    }

    if (project.organizationId !== organizationId) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    if (project.deletedAt) {
        throw new AppError(
            "Project not found",
            "PROJECT_NOT_FOUND",
            404
        );
    }

    return prisma.project.update({
        where: {
            id: projectId,
        },
        data: {
            name: data.name,
            description: data.description,
        },
    });
};


export const getProjectDashboardService = async (
    projectId,
    organizationId
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project || project.deletedAt) {
        throw new AppError(
            "Project not found",
            "PROJECT_NOT_FOUND",
            404
        );
    }

    // Prevent cross-tenant dashboard access.
    if (project.organizationId !== organizationId) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    const groupedTasks = await prisma.task.groupBy({
        by: ["status"],
        where: {
            projectId,
            deletedAt: null,
        },
        _count: {
            _all: true,
        },
    });

    const taskCounts = {
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
    };

    for (const item of groupedTasks) {
        taskCounts[item.status] = item._count._all;
    }

    return {
        project: {
            id: project.id,
            name: project.name,
        },
        taskCounts,
    };
};