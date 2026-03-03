const RoleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: User role not defined"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles.`
            });
        }

        next();
    };
};

export default RoleMiddleware;
