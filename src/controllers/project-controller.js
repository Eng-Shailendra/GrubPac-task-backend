import { createProjectService, getProjectsService, getProjectByIdService, updateProjectService, deleteProjectService, getProjectDashboardService } from "../services/project-services.js";

export const createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name || typeof name !== "string") {
            return res.status(400).json({
                error: "Project name is required",
                code: "INVALID_PROJECT_NAME",
                details: {},
            });
        }

        const project = await createProjectService(
            req.user.organizationId,
            name,
            description
        );

        return res.status(201).json({
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

export const getProjects = async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            100
        );

        const result = await getProjectsService(
            req.user.organizationId,
            page,
            limit
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export const getProject = async (req, res, next) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                message: "Invalid project id",
            });
        }

        const project = await getProjectByIdService(
            projectId,
            req.user.organizationId
        );

        return res.status(200).json({
            project,
        });

    }
    catch (err) {
        next(err);
    }
}

export const updateProject = async (req, res, next) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                error: "Invalid project id",
                code: "INVALID_PROJECT_ID",
                details: {},
            });
        }

        const project = await updateProjectService(
            projectId,
            req.user.organizationId,
            req.body
        );

        return res.status(200).json({
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                message: "Invalid project id",
            });
        }

        await deleteProjectService(
            projectId,
            req.user.organizationId
        );

        return res.status(200).json({
            message: "Project deleted successfully",
        });
    } catch (error) {
        next(error)
    }
};

export const getProjectDashboard = async (
    req,
    res,
    next
) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                error: "Invalid project id",
                code: "INVALID_PROJECT_ID",
                details: {},
            });
        }

        const dashboard = await getProjectDashboardService(
            projectId,
            req.user.organizationId
        );

        return res.status(200).json(dashboard);
    } catch (error) {
        next(error);
    }
};