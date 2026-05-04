export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource id',
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal server error' : err?.message || 'Internal server error',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};