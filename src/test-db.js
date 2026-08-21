import prisma from "./config/prisma.js";

const testDATABASE = async () => {
    try {
        const users = await prisma.user.findMany();
        console.log("Data base connected sucessfully");
        console.log("Users : ", users);


    }
    catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testDATABASE();