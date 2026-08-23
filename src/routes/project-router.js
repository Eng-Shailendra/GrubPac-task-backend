import { Router } from "express";
import { createProject, deleteProject, getProject, getProjectDashboard, getProjects, updateProject } from "../controllers/project-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { requireRole } from "../middleware/role-middleware.js";

const router = Router();

router.route("/")
    .post(authenticate, createProject)
    .get(authenticate, getProjects);

router.get("/:id/dashboard", authenticate, getProjectDashboard);

router.route("/:id")
    .get(authenticate, getProject)
    .patch(authenticate, updateProject)
    .delete(authenticate, requireRole("org_admin"), deleteProject);


export default router; 