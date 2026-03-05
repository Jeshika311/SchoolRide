import jwt from 'jsonwebtoken';

const AuthMiddleware = async (req, res, next) => {

    try{

      const {token} = req.cookies;

      if(!token){
        return res.status(401).json({
          success:false, 
          message: "Unauthorized: No token provided"
        })
      }

      const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

      if(tokenDecode?.id){
        req.user = {id: tokenDecode.id, role: tokenDecode.role};
      }
      else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token"
        });
      }

      req.user = {
        id: tokenDecode.id,
        role: tokenDecode.role
      };
      next();
    }

    catch(error){
      console.log("JWT error:", error.message);
      return res.status(401).json({
        success: false,
        message: 
          error.message === "jwt expired" ? "Unauthorized: Token expired" : "Unauthorized: Invalid token"
      });
  }
}

export default AuthMiddleware;
