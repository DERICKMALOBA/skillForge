const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
   

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Session expired', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    return res.status(401).json({ error: 'Invalid authentication' });
  }
};
  
module.exports = authenticate;
