const ErrorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[Error] ${statusCode} - ${message}`);

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? message : 'An internal error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export default ErrorMiddleware;
