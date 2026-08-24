import bcrypt from "bcrypt";
import prisma from "../../src/config/prisma.js";

export async function resetDatabase() {
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            "TaskAssignment",
            "Comment",
            "Task",
            "Project",
            "OrgMember",
            "RefreshToken",
            "Organization",
            "User"
        RESTART IDENTITY CASCADE
    `);
}

export async function createTestData() {
    const passwordHash = await bcrypt.hash("Password@123", 12);
    const orgA = await prisma.organization.create({ data: { name: "Test Org A" } });
    const orgB = await prisma.organization.create({ data: { name: "Test Org B" } });

    const users = await Promise.all([
        prisma.user.create({ data: { name: "Admin A", email: "admin-a@test.local", passwordHash } }),
        prisma.user.create({ data: { name: "Member A", email: "member-a@test.local", passwordHash } }),
        prisma.user.create({ data: { name: "Admin B", email: "admin-b@test.local", passwordHash } }),
        prisma.user.create({ data: { name: "Member B", email: "member-b@test.local", passwordHash } }),
    ]);

    await prisma.orgMember.createMany({
        data: [
            { userId: users[0].id, organizationId: orgA.id, role: "org_admin" },
            { userId: users[1].id, organizationId: orgA.id, role: "member" },
            { userId: users[2].id, organizationId: orgB.id, role: "org_admin" },
            { userId: users[3].id, organizationId: orgB.id, role: "member" },
        ],
    });

    const projectA = await prisma.project.create({
        data: { organizationId: orgA.id, name: "Project A" },
    });
    const projectB = await prisma.project.create({
        data: { organizationId: orgB.id, name: "Project B" },
    });

    const taskA = await prisma.task.create({
        data: { projectId: projectA.id, title: "Task A", description: "Tenant A task" },
    });
    const taskB = await prisma.task.create({
        data: { projectId: projectB.id, title: "Task B", description: "Tenant B task" },
    });

    return { orgA, orgB, users, projectA, projectB, taskA, taskB };
}
