class TestController {
  static getPublic(req, res) {
    return res.status(200).json({
      success: true,
      message: 'PUBLIC ACCESS: Anyone can view this endpoint without authentication.',
      timestamp: new Date().toISOString(),
    });
  }

  static getAuthenticated(req, res) {
    return res.status(200).json({
      success: true,
      message: `AUTHENTICATED ACCESS: You are signed in as ${req.user.email} with role [${req.user.role}].`,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  }

  static getManagerOnly(req, res) {
    return res.status(200).json({
      success: true,
      message: `MANAGER ACCESS GRANTED: Accessible by Managers and Admins. Your role is [${req.user.role}].`,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  }

  static getAdminOnly(req, res) {
    return res.status(200).json({
      success: true,
      message: `ADMIN ONLY ACCESS GRANTED: Critical operations allowed. Welcome Administrator ${req.user.first_name}!`,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = TestController;
