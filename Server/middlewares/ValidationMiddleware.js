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

        // Replace the request map with validated sanitised values
        req[source] = value;
        next();
    };
};

export default ValidationMiddleware;
