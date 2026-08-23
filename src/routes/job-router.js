import { Router } from "express";

import { getJob } from "../controllers/job-controller.js";

const router = Router();

router.get("/:id", getJob);

export default router;