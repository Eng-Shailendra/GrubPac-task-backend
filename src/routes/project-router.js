import { Router } from "express";
import { deleteProject, getProject } from "../controllers/project-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { requireRole } from "../middleware/role-middleware.js";

const router = Router();

router.get("/:id", authenticate,  getProject)

router.delete(
    "/:id",
    authenticate,
    requireRole("org_admin"),
    deleteProject
);

export default router; 