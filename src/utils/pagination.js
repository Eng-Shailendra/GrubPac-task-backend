export const getPagination = (pageValue = 1, limitValue = 20) => {
    const pageNumber = Number(pageValue);
    const limitNumber = Number(limitValue);

    const page = Number.isFinite(pageNumber)
        ? Math.max(Math.trunc(pageNumber), 1)
        : 1;

    const limit = Number.isFinite(limitNumber)
        ? Math.min(Math.max(Math.trunc(limitNumber), 1), 100)
        : 20;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};
