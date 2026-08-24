import request from "supertest";

export async function login(app, email, password = "Password@123") {
    const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

    return response;
}
