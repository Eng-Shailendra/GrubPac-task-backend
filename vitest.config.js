import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./tests/setup.js"],
        testTimeout: 30000,
        hookTimeout: 30000,
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "json-summary"],
            reportsDirectory: "./coverage",
            include: ["src/**/*.js"],
            exclude: [
                "src/seed.js",
                "src/test-db.js",
                "src/jobs/workers/**",
            ],
        },
    },
});
