/**
 * Helper for testing Next.js API routes
 *
 * Creates mock req/res objects that mimic Next.js API handler arguments.
 */

/**
 * Create a mock request object
 * @param {object} options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} [options.query] - Query parameters (includes [id] params)
 * @param {object} [options.body] - Request body
 * @returns {object} Mock request
 */
function createMockRequest({ method = 'GET', query = {}, body = {} } = {}) {
  return {
    method,
    query,
    body,
    headers: {},
  };
}

/**
 * Create a mock response object with jest spies
 * @returns {object} Mock response with .status(), .json(), and helper methods
 */
function createMockResponse() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data) => {
    res.body = data;
    return res;
  });
  res.end = jest.fn(() => res);
  return res;
}

/**
 * Call an API handler and return the response
 * @param {Function} handler - The Next.js API handler function
 * @param {object} options - Request options
 * @returns {Promise<{ statusCode: number, body: any }>}
 */
async function callHandler(handler, options = {}) {
  const req = createMockRequest(options);
  const res = createMockResponse();
  await handler(req, res);
  return { statusCode: res.statusCode, body: res.body };
}

module.exports = {
  createMockRequest,
  createMockResponse,
  callHandler,
};
