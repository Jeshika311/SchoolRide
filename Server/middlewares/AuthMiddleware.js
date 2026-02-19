import jwt from 'jsonwebtoken';

const AuthMiddleware = async (req, res, next) => {
  const {token} = req.cookies;

  if(!token){
    return res.status(401).json({
      success:false, 
      message: "Unauthorized: No token provided"
    })
  }

    try{
      const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

      if(tokenDecode.id){
        req.user = {id: tokenDecode.id, role: tokenDecode.role};
        next();
      }
      else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token"
        });
      }
      next();
    }

    catch(error){
      console.log("JWT error:", error.message);
      return res.status(401).json({
        success: false,
        message: error.message
      });
  }
}

export default AuthMiddleware;