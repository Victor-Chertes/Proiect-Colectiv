const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acces interzis. Doar administratorii pot efectua această acțiune.',
    });
  }
  next();
};

module.exports = requireAdmin;
