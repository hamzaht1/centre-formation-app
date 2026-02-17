/**
 * Tests API Presences
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/presences/index').default;
const idHandler = require('../../pages/api/presences/[id]').default;
const bulkHandler = require('../../pages/api/presences/bulk').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/presences', () => {
  it('retourne la liste paginée', async () => {
    prisma.presence.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.presence.count.mockResolvedValue(1);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('filtre par sessionId et statut', async () => {
    prisma.presence.findMany.mockResolvedValue([]);
    prisma.presence.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { sessionId: '1', statut: 'present' },
    });

    expect(prisma.presence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sessionId: 1,
          statut: 'present',
        }),
      })
    );
  });
});

describe('POST /api/presences', () => {
  it('crée une présence', async () => {
    prisma.presence.create.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        stagiaireId: '1',
        sessionId: '1',
        statut: 'present',
      },
    });

    expect(statusCode).toBe(201);
  });
});

describe('POST /api/presences/bulk', () => {
  it('crée des présences en masse', async () => {
    prisma.presence.createMany.mockResolvedValue({ count: 3 });

    const { statusCode, body } = await callHandler(bulkHandler, {
      method: 'POST',
      body: {
        presences: [
          { date: '2025-01-15', stagiaireId: 1, sessionId: 1, statut: 'present' },
          { date: '2025-01-15', stagiaireId: 2, sessionId: 1, statut: 'absent' },
          { date: '2025-01-15', stagiaireId: 3, sessionId: 1, statut: 'present' },
        ],
      },
    });

    expect(statusCode).toBe(201);
    expect(body.count).toBe(3);
  });

  it('rejette si format invalide', async () => {
    const { statusCode } = await callHandler(bulkHandler, {
      method: 'POST',
      body: { presences: 'invalid' },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette tableau vide', async () => {
    const { statusCode, body } = await callHandler(bulkHandler, {
      method: 'POST',
      body: { presences: [] },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/vide/);
  });

  it('rejette si trop de présences (> 500)', async () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({
      date: '2025-01-15',
      stagiaireId: i,
      sessionId: 1,
      statut: 'present',
    }));

    const { statusCode, body } = await callHandler(bulkHandler, {
      method: 'POST',
      body: { presences: tooMany },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/500/);
  });

  it('accepte exactement 500 présences', async () => {
    prisma.presence.createMany.mockResolvedValue({ count: 500 });

    const presences = Array.from({ length: 500 }, (_, i) => ({
      date: '2025-01-15',
      stagiaireId: i,
      sessionId: 1,
      statut: 'present',
    }));

    const { statusCode } = await callHandler(bulkHandler, {
      method: 'POST',
      body: { presences },
    });

    expect(statusCode).toBe(201);
  });
});

describe('GET /api/presences/[id]', () => {
  it('retourne une présence', async () => {
    prisma.presence.findUnique.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });

  it('retourne 404', async () => {
    prisma.presence.findUnique.mockResolvedValue(null);

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '999' },
    });

    expect(statusCode).toBe(404);
  });
});

describe('DELETE /api/presences/[id]', () => {
  it('supprime une présence', async () => {
    prisma.presence.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
