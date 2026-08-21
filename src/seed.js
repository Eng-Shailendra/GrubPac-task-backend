import bcrypt from "bcrypt";
import prisma from './config/prisma.js'

async function main() {
    console.log("🌱 Starting database seed...");

    // --------------------------------------------------
    // Passwords
    // --------------------------------------------------

    const passwordHash = await bcrypt.hash("Password@123", 12);

    // --------------------------------------------------
    // Users
    // --------------------------------------------------

    const adminA = await prisma.user.create({
        data: {
            name: "Alice Admin",
            email: "alice@taskflow.com",
            passwordHash,
        },
    });

    const memberA1 = await prisma.user.create({
        data: {
            name: "Bob Member",
            email: "bob@taskflow.com",
            passwordHash,
        },
    });

    const memberA2 = await prisma.user.create({
        data: {
            name: "Charlie Member",
            email: "charlie@taskflow.com",
            passwordHash,
        },
    });

    const adminB = await prisma.user.create({
        data: {
            name: "David Admin",
            email: "david@taskflow.com",
            passwordHash,
        },
    });

    const memberB = await prisma.user.create({
        data: {
            name: "Eva Member",
            email: "eva@taskflow.com",
            passwordHash,
        },
    });

    // --------------------------------------------------
    // Organizations
    // --------------------------------------------------

    const organizationA = await prisma.organization.create({
        data: {
            name: "Acme Corporation",
        },
    });

    const organizationB = await prisma.organization.create({
        data: {
            name: "Tech Solutions",
        },
    });

    // --------------------------------------------------
    // Organization Members
    // --------------------------------------------------

    await prisma.orgMember.createMany({
        data: [
            {
                userId: adminA.id,
                organizationId: organizationA.id,
                role: "org_admin",
            },
            {
                userId: memberA1.id,
                organizationId: organizationA.id,
                role: "member",
            },
            {
                userId: memberA2.id,
                organizationId: organizationA.id,
                role: "member",
            },
            {
                userId: adminB.id,
                organizationId: organizationB.id,
                role: "org_admin",
            },
            {
                userId: memberB.id,
                organizationId: organizationB.id,
                role: "member",
            },
        ],
    });

    // --------------------------------------------------
    // Projects
    // --------------------------------------------------

    const projectA1 = await prisma.project.create({
        data: {
            organizationId: organizationA.id,
            name: "Website Redesign",
            description: "Redesign the company website.",
        },
    });

    const projectA2 = await prisma.project.create({
        data: {
            organizationId: organizationA.id,
            name: "Mobile Application",
            description: "Build the TaskFlow mobile application.",
        },
    });

    const projectB1 = await prisma.project.create({
        data: {
            organizationId: organizationB.id,
            name: "Internal Dashboard",
            description: "Build an internal analytics dashboard.",
        },
    });

    // --------------------------------------------------
    // Tasks
    // --------------------------------------------------

    const tasks = await prisma.task.createMany({
        data: [
            {
                projectId: projectA1.id,
                title: "Create wireframes",
                description: "Create website wireframes.",
                status: "done",
                priority: "high",
            },
            {
                projectId: projectA1.id,
                title: "Implement homepage",
                description: "Develop the new homepage.",
                status: "in_progress",
                priority: "urgent",
            },
            {
                projectId: projectA1.id,
                title: "Create navigation",
                description: "Implement website navigation.",
                status: "review",
                priority: "medium",
            },
            {
                projectId: projectA1.id,
                title: "Write SEO content",
                description: "Prepare SEO content.",
                status: "todo",
                priority: "low",
            },
            {
                projectId: projectA2.id,
                title: "Design login screen",
                description: "Design mobile login screen.",
                status: "done",
                priority: "medium",
            },
            {
                projectId: projectA2.id,
                title: "Implement authentication",
                description: "Implement mobile authentication.",
                status: "in_progress",
                priority: "urgent",
            },
            {
                projectId: projectA2.id,
                title: "Implement push notifications",
                description: "Add push notifications.",
                status: "todo",
                priority: "high",
            },
            {
                projectId: projectA2.id,
                title: "Write unit tests",
                description: "Add unit tests for mobile application.",
                status: "todo",
                priority: "medium",
            },
            {
                projectId: projectB1.id,
                title: "Design dashboard",
                description: "Create dashboard design.",
                status: "done",
                priority: "high",
            },
            {
                projectId: projectB1.id,
                title: "Create analytics API",
                description: "Create API for dashboard analytics.",
                status: "in_progress",
                priority: "urgent",
            },
            {
                projectId: projectB1.id,
                title: "Add charts",
                description: "Add analytics charts.",
                status: "todo",
                priority: "medium",
            },
            {
                projectId: projectB1.id,
                title: "Add export feature",
                description: "Allow users to export reports.",
                status: "todo",
                priority: "low",
            },
        ],
    });

    // --------------------------------------------------
    // Fetch tasks for assignments/comments
    // --------------------------------------------------

    const projectATasks = await prisma.task.findMany({
        where: {
            projectId: {
                in: [projectA1.id, projectA2.id],
            },
        },
        orderBy: {
            id: "asc",
        },
    });

    const projectBTasks = await prisma.task.findMany({
        where: {
            projectId: projectB1.id,
        },
        orderBy: {
            id: "asc",
        },
    });

    // --------------------------------------------------
    // Task Assignments
    // --------------------------------------------------

    await prisma.taskAssignment.createMany({
        data: [
            {
                taskId: projectATasks[0].id,
                userId: memberA1.id,
            },
            {
                taskId: projectATasks[1].id,
                userId: memberA2.id,
            },
            {
                taskId: projectATasks[2].id,
                userId: memberA1.id,
            },
            {
                taskId: projectATasks[3].id,
                userId: memberA2.id,
            },
            {
                taskId: projectATasks[4].id,
                userId: memberA1.id,
            },
            {
                taskId: projectATasks[5].id,
                userId: memberA2.id,
            },
            {
                taskId: projectATasks[6].id,
                userId: memberA1.id,
            },
            {
                taskId: projectATasks[7].id,
                userId: memberA2.id,
            },
            {
                taskId: projectBTasks[0].id,
                userId: memberB.id,
            },
            {
                taskId: projectBTasks[1].id,
                userId: memberB.id,
            },
            {
                taskId: projectBTasks[2].id,
                userId: memberB.id,
            },
        ],
    });

    // --------------------------------------------------
    // Comments
    // --------------------------------------------------

    await prisma.comment.createMany({
        data: [
            {
                taskId: projectATasks[0].id,
                userId: memberA1.id,
                content: "Wireframes are ready for review.",
            },
            {
                taskId: projectATasks[1].id,
                userId: memberA2.id,
                content: "Homepage implementation is in progress.",
            },
            {
                taskId: projectATasks[2].id,
                userId: adminA.id,
                content: "Please review the navigation structure.",
            },
            {
                taskId: projectATasks[5].id,
                userId: memberA2.id,
                content: "Authentication API is almost complete.",
            },
            {
                taskId: projectBTasks[0].id,
                userId: memberB.id,
                content: "Dashboard design has been completed.",
            },
            {
                taskId: projectBTasks[1].id,
                userId: adminB.id,
                content: "Analytics API is being implemented.",
            },
        ],
    });

    console.log("✅ Database seeded successfully!");
    console.log("");
    console.log("Users:");
    console.log("  alice@taskflow.com   → org_admin");
    console.log("  bob@taskflow.com     → member");
    console.log("  charlie@taskflow.com → member");
    console.log("  david@taskflow.com   → org_admin");
    console.log("  eva@taskflow.com     → member");
    console.log("");
    console.log("Password for all users: Password@123");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });