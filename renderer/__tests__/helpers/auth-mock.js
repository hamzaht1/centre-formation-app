/**
 * Mock auth module for testing API routes
 *
 * This mock auto-authorizes all requests so existing tests
 * continue to pass without needing real JWT tokens.
 *
 * Usage:
 *   jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));
 */

const defaultUser = {
  userId: 1,
  email: 'admin@formation.com',
  role: 'admin',
};

const authMock = {
  _mockUser: { ...defaultUser },

  signToken: jest.fn((user) => 'mock-jwt-token'),

  verifyToken: jest.fn((token) => authMock._mockUser),

  verifyAuth: jest.fn((req, res) => {
    return authMock._mockUser;
  }),

  requireRole: jest.fn((req, res, ...roles) => {
    if (roles.includes(authMock._mockUser.role)) {
      return authMock._mockUser;
    }
    res.status(403).json({ error: 'Accès interdit' });
    return null;
  }),

  /**
   * Reset all mocks and restore default user
   */
  __resetAll: () => {
    authMock._mockUser = { ...defaultUser };
    authMock.signToken.mockClear();
    authMock.verifyToken.mockClear();
    authMock.verifyAuth.mockClear();
    authMock.requireRole.mockClear();

    authMock.signToken.mockImplementation((user) => 'mock-jwt-token');
    authMock.verifyToken.mockImplementation((token) => authMock._mockUser);
    authMock.verifyAuth.mockImplementation((req, res) => authMock._mockUser);
    authMock.requireRole.mockImplementation((req, res, ...roles) => {
      if (roles.includes(authMock._mockUser.role)) {
        return authMock._mockUser;
      }
      res.status(403).json({ error: 'Accès interdit' });
      return null;
    });
  },

  /**
   * Set the mock user for subsequent calls
   */
  __setUser: (user) => {
    authMock._mockUser = { ...defaultUser, ...user };
  },
};

module.exports = authMock;
