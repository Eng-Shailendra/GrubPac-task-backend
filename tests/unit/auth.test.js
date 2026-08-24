import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_ACCESS_SECRET ||= "unit-access-secret";
process.env.JWT_REFRESH_SECRET ||= "unit-refresh-secret";

const { verifyAccessTokenMock } = vi.hoisted(() => ({
    verifyAccessTokenMock: vi.fn(),
}));

vi.mock("../../src/utils/jwt.js", () => ({
    verifyAccessToken: verifyAccessTokenMock,
}));

import { authenticate } from "../../src/middleware/auth-middleware.js";

describe("authentication middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when Authorization header is missing", () => {
        const req = { headers: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        const next = vi.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects an invalid token", () => {
        verifyAccessTokenMock.mockImplementation(() => {
            throw new Error("invalid token");
        });

        const req = { headers: { authorization: "Bearer bad-token" } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        const next = vi.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("attaches authenticated user context", () => {
        verifyAccessTokenMock.mockReturnValue({
            userId: 10,
            organizationId: 20,
            role: "org_admin",
        });

        const req = { headers: { authorization: "Bearer valid-token" } };
        const res = {};
        const next = vi.fn();

        authenticate(req, res, next);

        expect(req.user).toEqual({
            id: 10,
            organizationId: 20,
            role: "org_admin",
        });
        expect(next).toHaveBeenCalledOnce();
    });
});
