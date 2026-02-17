/**
 * Tests API Sessions
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/sessions/index').default;
const idHandler = require('../../pages/api/sessions/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/sessions', () => {
  it('retourne la liste', async () => {
    const mockData = [{ id: 1, nom: 'Session Jan' }];
    prisma.session.findMany.mockResolvedValue(mockData);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body).toEqual(mockData);
  });

  it('filtre par formationId', async () => {
    prisma.session.findMany.mockResolvedValue([]);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { formationId: '1' },
    });

    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ formationId: 1 }),
      })
    );
  });
});

describe('POST /api/sessions', () => {
  it('crée une session valide', async () => {
    const mockSession = { id: 1, nom: 'Session Test' };
    prisma.session.create.mockResolvedValue(mockSession);

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        nom: 'Session Test',
        formationId: '1',
        dateDebut: '2025-01-01',
        dateFin: '2025-06-01',
      },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si champs requis manquants', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Test' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/requis/);
  });

  it('rejette si dateDebut > dateFin', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        nom: 'Session Test',
        formationId: '1',
        dateDebut: '2025-06-01',
        dateFin: '2025-01-01',
      },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/date/i);
  });

  it('rejette si dates identiques', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        nom: 'Session Test',
        formationId: '1',
        dateDebut: '2025-01-01',
        dateFin: '2025-01-01',
      },
    });

    expect(statusCode).toBe(400);
  });
});

describe('GET /api/sessions/[id]', () => {
  it('retourne une session avec stats', async () => {
    const mockSession = {
      id: 1,
      nom: 'Session Test',
      capaciteMax: 20,
      _count: { inscriptions: 5, planning: 10, presences: 50 },
    };
    prisma.session.findUnique.mockResolvedValue(mockSession);

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
    expect(body.stats.placesRestantes).toBe(15);
    expect(body.stats.tauxRemplissage).toBe(25);
  });

  it('retourne 404', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '999' },
    });

    expect(statusCode).toBe(404);
  });

  it('retourne 400 si id invalide', async () => {
    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: 'abc' },
    });

    expect(statusCode).toBe(400);
  });
});

describe('DELETE /api/sessions/[id]', () => {
  it('empêche suppression si inscriptions existent', async () => {
    prisma.inscription.count.mockResolvedValue(5);

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(400);
  });

  it('supprime si aucune inscription', async () => {
    prisma.inscription.count.mockResolvedValue(0);
    prisma.session.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
