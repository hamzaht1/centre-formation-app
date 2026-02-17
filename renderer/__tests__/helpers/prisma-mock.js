/**
 * Mock Prisma client for testing API routes
 *
 * Usage:
 *   jest.mock('../../../lib/prisma', () => require('../../__tests__/helpers/prisma-mock'));
 */

const createMockModel = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findUnique: jest.fn().mockResolvedValue(null),
  findFirst: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  createMany: jest.fn().mockResolvedValue({ count: 0 }),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  count: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue({ _sum: { montant: 0 } }),
});

const prismaMock = {
  stagiaire: createMockModel(),
  formation: createMockModel(),
  session: createMockModel(),
  formateur: createMockModel(),
  inscription: createMockModel(),
  planning: createMockModel(),
  presence: createMockModel(),
  paiement: createMockModel(),
  salle: createMockModel(),
  disponibilite: createMockModel(),
  livre: createMockModel(),
  livreStagiaire: createMockModel(),
  user: createMockModel(),
  otpCode: createMockModel(),
  $transaction: jest.fn((arg) => Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock)),
};

// Helper to reset all mocks
prismaMock.__resetAll = () => {
  Object.keys(prismaMock).forEach((key) => {
    if (key === '__resetAll' || key === '$transaction') return;
    const model = prismaMock[key];
    Object.keys(model).forEach((method) => {
      if (typeof model[method]?.mockReset === 'function') {
        model[method].mockReset();
        // Restore default implementations
        if (method === 'findMany') model[method].mockResolvedValue([]);
        else if (method === 'findUnique' || method === 'findFirst')
          model[method].mockResolvedValue(null);
        else if (method === 'create' || method === 'update' || method === 'delete')
          model[method].mockResolvedValue({});
        else if (method === 'createMany' || method === 'deleteMany')
          model[method].mockResolvedValue({ count: 0 });
        else if (method === 'count') model[method].mockResolvedValue(0);
        else if (method === 'aggregate')
          model[method].mockResolvedValue({ _sum: { montant: 0 } });
      }
    });
  });
  prismaMock.$transaction.mockReset();
  prismaMock.$transaction.mockImplementation((arg) => Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock));
};

module.exports = prismaMock;
module.exports.default = prismaMock;
