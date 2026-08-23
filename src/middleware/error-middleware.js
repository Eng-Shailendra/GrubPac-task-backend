export const errorHandler = (err, req, res, next) => {
    console.log(err);
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        error: err.message || "Internal server error",
        code: err.code || "INTERNAL_SERVER_ERROR",
        details: err.details || {},
    });
}
