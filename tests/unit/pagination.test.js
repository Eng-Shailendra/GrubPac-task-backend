import { describe, expect, it } from "vitest";
import { getPagination } from "../../src/utils/pagination.js";

describe("pagination helper", () => {
    it("uses defaults", () => {
        expect(getPagination()).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it("calculates skip correctly", () => {
        expect(getPagination(3, 10)).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it("clamps invalid page and limit values", () => {
        expect(getPagination(0, 0)).toEqual({ page: 1, limit: 1, skip: 0 });
        expect(getPagination(-10, 500)).toEqual({ page: 1, limit: 100, skip: 0 });
    });

    it("falls back for non-numeric input", () => {
        expect(getPagination("abc", "xyz")).toEqual({ page: 1, limit: 20, skip: 0 });
    });
});
