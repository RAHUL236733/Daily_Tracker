import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.user = { id: decoded.userId };
      } catch (error) {
        // Token invalid but optional, so we continue
      }
    }

    next();
  } catch (error) {
    next();
  }
};
