import jwt from 'jsonwebtoken';

const AuthMiddleware = async (req, res, next) => {
  try {

    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided"
      });
    }

    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: tokenDecode.id,
      role: tokenDecode.role
    };

    next();

  } catch (error) {
    console.log("JWT error:", error.message);

    return res.status(401).json({
      success: false,
      message:
        error.message === "jwt expired"
          ? "Unauthorized: Token expired"
          : "Unauthorized: Invalid token"
    });
  }
};

export default AuthMiddleware;