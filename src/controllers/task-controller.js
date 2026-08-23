import { unassignUserFromTaskService } from "../services/task-services.js";
import { assignUserToTaskService } from "../services/task-services.js";
import { createTaskService, getTasksService, getTaskByIdService, updateTaskService, deleteTaskService, } from "../services/task-services.js";

export const createTask = async (req, res, next) => {
    try {
        const projectId = Number(req.body.projectId);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                error: "Invalid project id",
                code: "INVALID_PROJECT_ID",
                details: {},
            });
        }

        if (
            !req.body.title ||
            typeof req.body.title !== "string"
        ) {
            return res.status(400).json({
                error: "Task title is required",
                code: "INVALID_TASK_TITLE",
                details: {},
            });
        }

        const task = await createTaskService(
            req.user.organizationId,
            projectId,
            req.body
        );

        return res.status(201).json({
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const getTasks = async (req, res, next) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            100
        );

        const result = await getTasksService(
            req.user.organizationId,
            {
                page,
                limit,
                status: req.query.status,
                priority: req.query.priority,
                assignee: req.query.assignee,
                dueFrom: req.query.dueFrom,
                dueTo: req.query.dueTo,
            }
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getTask = async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId)) {
            return res.status(400).json({
                error: "Invalid task id",
                code: "INVALID_TASK_ID",
                details: {},
            });
        }

        const task = await getTaskById(
            taskId,
            req.user.organizationId
        );

        return res.status(200).json({
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId)) {
            return res.status(400).json({
                error: "Invalid task id",
                code: "INVALID_TASK_ID",
                details: {},
            });
        }

        const task = await updateTaskService(
            taskId,
            req.user.organizationId,
            req.body
        );

        return res.status(200).json({
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId)) {
            return res.status(400).json({
                error: "Invalid task id",
                code: "INVALID_TASK_ID",
                details: {},
            });
        }

        await deleteTaskService(
            taskId,
            req.user.organizationId
        );

        return res.status(200).json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const assignUserToTask = async (
    req,
    res,
    next
) => {
    try {
        const taskId = Number(req.params.taskId);
        const userId = Number(req.body.userId);

        if (!Number.isInteger(taskId)) {
            return res.status(400).json({
                error: "Invalid task id",
                code: "INVALID_TASK_ID",
                details: {},
            });
        }

        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                error: "Invalid user id",
                code: "INVALID_USER_ID",
                details: {},
            });
        }

        const assignment = await assignUserToTaskService(
            taskId,
            userId,
            req.user.organizationId
        );

        return res.status(201).json({
            data: assignment,
        });
    } catch (error) {
        next(error);
    }
};

export const unassignUserFromTask = async (
    req,
    res,
    next
) => {
    try {
        const taskId = Number(req.params.taskId);
        const userId = Number(req.params.userId);

        if (!Number.isInteger(taskId)) {
            return res.status(400).json({
                error: "Invalid task id",
                code: "INVALID_TASK_ID",
                details: {},
            });
        }

        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                error: "Invalid user id",
                code: "INVALID_USER_ID",
                details: {},
            });
        }

        await unassignUserFromTaskService(
            taskId,
            userId,
            req.user.organizationId
        );

        return res.status(200).json({
            message: "User unassigned successfully",
        });
    } catch (error) {
        next(error);
    }
};