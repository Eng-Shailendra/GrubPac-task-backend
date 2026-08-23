import { Router } from "express";
import * as controller from "../controllers/auth-controller.js"
import { authRateLimiter } from "../middleware/rateLimiter-middleware.js";

const router = Router();

router.post("/register", authRateLimiter, controller.register)
router.post("/login", authRateLimiter, controller.login);
router.post("/refresh", authRateLimiter, controller.refresh)
router.post("/logout", authRateLimiter, controller.logoutUser)

export default router;