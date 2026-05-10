import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    const accessCookie = req.cookies?.accessToken;

    // Priority 1: Bearer token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
      console.log('[auth] Using Bearer token from Authorization header');
    }
    // Priority 2: accessToken from HttpOnly cookie
    else if (accessCookie) {
      token = accessCookie;
      console.log('[auth] Using accessToken from HttpOnly cookie');
    }

    if (!token) {
      console.log('[auth] No token found in Authorization header or cookies');
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, role: decoded.role };
      console.log(`[auth] Token verified for user: ${decoded.userId}`);
      next();
    } catch (tokenError) {
      console.log(`[auth] Token verification failed: ${tokenError.message}`);
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('[auth] Middleware error:', error);
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
