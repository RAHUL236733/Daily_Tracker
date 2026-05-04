import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    let token;

    // Accept either the legacy bearer token or the new HttpOnly cookie.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, role: decoded.role };
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
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.user = { id: decoded.userId, role: decoded.role };
      } catch (error) {
        // Token invalid but optional, so we continue
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return next();
};
