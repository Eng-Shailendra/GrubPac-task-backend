import { getJobStatus } from "../services/job-services.js";

export const getJob = async (req, res, next) => {
    try {
        const job = await getJobStatus(req.params.id);

        if (!job) {
            return res.status(404).json({
                error: "Job not found",
                code: "JOB_NOT_FOUND",
                details: {},
            });
        }

        return res.status(200).json(job);

    } catch (error) {
        next(error);
    }
};