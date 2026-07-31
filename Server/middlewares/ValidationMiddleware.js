const ValidationMiddleware = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: `Validation Error: ${errorMessage}`,
            });
        }

        // Express 5 exposes req.query as a read-only getter, so keep validated
        // query values on a separate property instead of assigning to req.query.
        if (source === 'query') {
            req.validatedQuery = value;
        } else {
            req[source] = value;
        }
        next();
    };
};

export default ValidationMiddleware;
