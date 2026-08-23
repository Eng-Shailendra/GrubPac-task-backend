import { Router } from "express";

import {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    unassignUserFromTask,
    assignUserToTask,
} from "../controllers/task-controller.js";

import { authenticate } from "../middleware/auth-middleware.js";

const router = Router();

router.route("/")
    .post(authenticate, createTask)
    .get(authenticate, getTasks);

router.post(
    "/:taskId/assign",
    authenticate,
    assignUserToTask
);

router.delete(
    "/:taskId/assign/:userId",
    authenticate,
    unassignUserFromTask
);

router.route("/:id")
    .get(authenticate, getTask)
    .patch(authenticate, updateTask)
    .delete(authenticate, deleteTask);


export default router;