import prisma from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

export const createTaskService = async (
    organizationId,
    projectId,
    data
) => {
    // Verify that the project belongs to the user's organization.
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

    if (project.organizationId !== organizationId) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    return prisma.task.create({
        data: {
            projectId,
            title: data.title,
            description: data.description,
            status: data.status || "todo",
            priority: data.priority || "medium",
            dueDate: data.dueDate
                ? new Date(data.dueDate)
                : null,
        },
    });
};

export const getTasksService = async (
    organizationId,
    {
        page = 1,
        limit = 20,
        status,
        priority,
        assignee,
        dueFrom,
        dueTo,
    }
) => {
    const skip = (page - 1) * limit;

    const where = {
        deletedAt: null,

        // Every task must belong to a project
        // inside the authenticated user's organization.
        project: {
            organizationId,
            deletedAt: null,
        },
    };

    // Status filter
    if (status) {
        where.status = status;
    }

    // Priority filter
    if (priority) {
        where.priority = priority;
    }

    // Assignee filter
    if (assignee) {
        where.assignments = {
            some: {
                userId: Number(assignee),
            },
        };
    }

    // Due-date range
    if (dueFrom || dueTo) {
        where.dueDate = {};

        if (dueFrom) {
            where.dueDate.gte = new Date(dueFrom);
        }

        if (dueTo) {
            where.dueDate.lte = new Date(dueTo);
        }
    }

    const [tasks, total] = await prisma.$transaction([
        prisma.task.findMany({
            where,

            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },

            orderBy: {
                id: "asc",
            },

            skip,
            take: limit,
        }),

        prisma.task.count({
            where,
        }),
    ]);

    return {
        data: tasks,
        total,
        page,
        limit,
    };
};

export const getTaskByIdService = async (
    taskId,
    organizationId
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: true,
            assignments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            comments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    if (!task || task.deletedAt) {
        throw new AppError(
            "Task not found",
            "TASK_NOT_FOUND",
            404
        );
    }

    if (
        task.project.organizationId !== organizationId
    ) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    return task;
};

export const updateTaskService = async (
    taskId,
    organizationId,
    data
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: true,
        },
    });

    if (!task || task.deletedAt) {
        throw new AppError(
            "Task not found",
            "TASK_NOT_FOUND",
            404
        );
    }

    if (
        task.project.organizationId !== organizationId
    ) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    return prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate
                ? new Date(data.dueDate)
                : data.dueDate === null
                    ? null
                    : undefined,
        },
    });
};

export const deleteTaskService = async (
    taskId,
    organizationId
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: true,
        },
    });

    if (!task || task.deletedAt) {
        throw new AppError(
            "Task not found",
            "TASK_NOT_FOUND",
            404
        );
    }

    if (
        task.project.organizationId !== organizationId
    ) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            deletedAt: new Date(),
        },
    });
};


export const assignUserToTaskService = async (
    taskId,
    userId,
    organizationId
) => {
    // Get task and its organization through the project.
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: true,
        },
    });

    if (!task || task.deletedAt) {
        throw new AppError(
            "Task not found",
            "TASK_NOT_FOUND",
            404
        );
    }

    // Task must belong to authenticated user's organization.
    if (task.project.organizationId !== organizationId) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    // User must belong to the same organization.
    const member = await prisma.orgMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!member) {
        throw new AppError(
            "User does not belong to this organization",
            "INVALID_ASSIGNEE",
            400
        );
    }

    // Prevent duplicate assignment.
    const existingAssignment =
        await prisma.taskAssignment.findUnique({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });

    if (existingAssignment) {
        throw new AppError(
            "User is already assigned to this task",
            "ALREADY_ASSIGNED",
            409
        );
    }

    return prisma.taskAssignment.create({
        data: {
            taskId,
            userId,
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
};

export const unassignUserFromTaskService = async (
    taskId,
    userId,
    organizationId
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: true,
        },
    });

    if (!task || task.deletedAt) {
        throw new AppError(
            "Task not found",
            "TASK_NOT_FOUND",
            404
        );
    }

    if (task.project.organizationId !== organizationId) {
        throw new AppError(
            "Forbidden",
            "FORBIDDEN",
            403
        );
    }

    const assignment =
        await prisma.taskAssignment.findUnique({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });

    if (!assignment) {
        throw new AppError(
            "User is not assigned to this task",
            "ASSIGNMENT_NOT_FOUND",
            404
        );
    }

    await prisma.taskAssignment.delete({
        where: {
            taskId_userId: {
                taskId,
                userId,
            },
        },
    });
};