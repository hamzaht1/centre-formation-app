/**
 * Tests API Planning
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/planning/index').default;
const idHandler = require('../../pages/api/planning/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/planning', () => {
  it('retourne la liste', async () => {
    prisma.planning.findMany.mockResolvedValue([{ id: 1 }]);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body).toHaveLength(1);
  });

  it('filtre par formateurId', async () => {
    prisma.planning.findMany.mockResolvedValue([]);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { formateurId: '1' },
    });

    expect(prisma.planning.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ formateurId: 1 }),
      })
    );
  });
});

describe('POST /api/planning', () => {
  it('crée un planning valide', async () => {
    prisma.planning.findFirst.mockResolvedValue(null);
    prisma.planning.create.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        sessionId: '1',
        formateurId: '1',
        heureDebut: '09:00',
        heureFin: '12:00',
      },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si champs requis manquants', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { date: '2025-01-15' },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette si heureDebut >= heureFin', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        sessionId: '1',
        formateurId: '1',
        heureDebut: '14:00',
        heureFin: '09:00',
      },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/heure/i);
  });

  it('rejette si heures identiques', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        sessionId: '1',
        formateurId: '1',
        heureDebut: '09:00',
        heureFin: '09:00',
      },
    });

    expect(statusCode).toBe(400);
  });

  it('détecte conflit formateur', async () => {
    prisma.planning.findFirst.mockResolvedValue({ id: 99 });

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        sessionId: '1',
        formateurId: '1',
        heureDebut: '09:00',
        heureFin: '12:00',
      },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/conflit/i);
  });

  it('normalise les heures (9:00 -> 09:00)', async () => {
    prisma.planning.findFirst.mockResolvedValue(null);
    prisma.planning.create.mockResolvedValue({ id: 1 });

    await callHandler(indexHandler, {
      method: 'POST',
      body: {
        date: '2025-01-15',
        sessionId: '1',
        formateurId: '1',
        heureDebut: '9:00',
        heureFin: '12:00',
      },
    });

    expect(prisma.planning.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          heureDebut: '09:00',
          heureFin: '12:00',
        }),
      })
    );
  });
});

describe('PUT /api/planning/[id]', () => {
  it('gère "0:00" sans être falsy', async () => {
    prisma.planning.update.mockResolvedValue({ id: 1, heureDebut: '0:00' });

    await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { heureDebut: '0:00' },
    });

    // heureDebut should NOT be undefined (the old bug with || operator)
    expect(prisma.planning.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          heureDebut: '0:00',
        }),
      })
    );
  });

  it('retourne 400 si id invalide', async () => {
    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: 'abc' },
      body: {},
    });

    expect(statusCode).toBe(400);
  });
});

describe('DELETE /api/planning/[id]', () => {
  it('supprime un planning', async () => {
    prisma.planning.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
