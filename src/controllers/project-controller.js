import { getProjectById, deleteProject as deleteProjectService } from "../services/project-services.js";


export const getProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                message: "Invalid project id",
            });
        }

        const project = await getProjectById(
            projectId,
            req.user.organizationId
        );

        return res.status(200).json({
            project,
        });

    }
    catch (err) {
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
}

export const deleteProject = async (req, res) => {
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
        console.error(error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};