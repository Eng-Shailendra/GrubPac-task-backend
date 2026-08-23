import { Router } from "express";

import {
    listMembers,
    changeMemberRole,
    deleteMember,
} from "../controllers/member-controller.js";

import { authenticate } from "../middleware/auth-middleware.js";
import { requireRole } from "../middleware/role-middleware.js";

const router = Router();

router.get(
    "/",
    authenticate,
    requireRole("org_admin"),
    listMembers
);

router.patch(
    "/:id/role",
    authenticate,
    requireRole("org_admin"),
    changeMemberRole
);

router.delete(
    "/:id",
    authenticate,
    requireRole("org_admin"),
    deleteMember
);

export default router;