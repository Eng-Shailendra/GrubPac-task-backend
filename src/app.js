import express from "express";
const app = express();
import authRouter from "./routes/auth-router.js";
import projectRouter from "./routes/project-router.js";
import memberRouter from "./routes/member-router.js"
import { authenticate } from "./middleware/auth-middleware.js";
import { requireRole } from "./middleware/role-middleware.js";


app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/members", memberRouter);

app.get("/me", authenticate, (req, res) => {
    res.json({
        message: "Authenticated successfully",
        user: req.user,
    });
});
app.get(
    "/admin",
    authenticate,
    requireRole("org_admin"),
    (req, res) => {
        res.json({
            message: "Admin access granted",
            user: req.user,
        });
    }

);

app.get(
    "/member",
    authenticate,
    requireRole("member"),
    (req, res) => {
        res.json({
            message: "Member access granted",
            user: req.user,
        });
    }
)


export default app; 