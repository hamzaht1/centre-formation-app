/**
 * Tests API Salles
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/salles/index').default;
const idHandler = require('../../pages/api/salles/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/salles', () => {
  it('retourne la liste', async () => {
    prisma.salle.findMany.mockResolvedValue([{ id: 1, nom: 'Salle A101' }]);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body).toHaveLength(1);
  });

  it('filtre par type et capacité', async () => {
    prisma.salle.findMany.mockResolvedValue([]);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { type: 'informatique', capaciteMin: '20' },
    });

    expect(prisma.salle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'informatique',
          capacite: { gte: 20 },
        }),
      })
    );
  });
});

describe('POST /api/salles', () => {
  it('crée une salle valide', async () => {
    prisma.salle.create.mockResolvedValue({ id: 1, nom: 'Salle B202' });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Salle B202', capacite: '30' },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si nom/capacite manquants', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Salle B202' },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette capacité invalide', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Salle B202', capacite: 'abc' },
    });

    expect(statusCode).toBe(400);
  });

  it('gère P2002 (nom unique)', async () => {
    prisma.salle.create.mockRejectedValue({ code: 'P2002' });

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Salle A101', capacite: '30' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/existe déjà/);
  });
});

describe('GET /api/salles/[id]', () => {
  it('retourne une salle', async () => {
    prisma.salle.findUnique.mockResolvedValue({ id: 1, nom: 'Salle A101' });

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });

  it('retourne 404', async () => {
    prisma.salle.findUnique.mockResolvedValue(null);

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '999' },
    });

    expect(statusCode).toBe(404);
  });
});

describe('PUT /api/salles/[id]', () => {
  it('met à jour avec !== undefined pour capacité', async () => {
    prisma.salle.update.mockResolvedValue({ id: 1 });

    await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { capacite: '25' },
    });

    expect(prisma.salle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ capacite: 25 }),
      })
    );
  });
});

describe('DELETE /api/salles/[id]', () => {
  it('empêche suppression si sessions existent', async () => {
    prisma.session.count.mockResolvedValue(2);

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(400);
  });

  it('supprime si pas de sessions', async () => {
    prisma.session.count.mockResolvedValue(0);
    prisma.salle.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
