/**
 * Tests API Paiements
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/paiements/index').default;
const idHandler = require('../../pages/api/paiements/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/paiements', () => {
  it('retourne la liste paginée', async () => {
    prisma.paiement.findMany.mockResolvedValue([{ id: 1, montant: 100 }]);
    prisma.paiement.count.mockResolvedValue(1);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('filtre par stagiaireId', async () => {
    prisma.paiement.findMany.mockResolvedValue([]);
    prisma.paiement.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { stagiaireId: '1' },
    });

    expect(prisma.paiement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stagiaireId: 1 }),
      })
    );
  });
});

describe('POST /api/paiements', () => {
  it('crée un paiement valide', async () => {
    prisma.paiement.create.mockResolvedValue({ id: 1, montant: 100 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: 100 },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si champs requis manquants', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { montant: 100 },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette montant négatif', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: -50 },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/montant/);
  });

  it('rejette montant à zéro', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: 0 },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette montant NaN', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: 'abc' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/montant/);
  });

  it('rejette modePaiement invalide', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: 100, modePaiement: 'bitcoin' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/modePaiement/);
  });

  it('accepte modePaiement valide', async () => {
    prisma.paiement.create.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, montant: 100, modePaiement: 'carte' },
    });

    expect(statusCode).toBe(201);
  });
});

describe('GET /api/paiements/[id]', () => {
  it('retourne un paiement', async () => {
    prisma.paiement.findUnique.mockResolvedValue({ id: 1, montant: 100 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });

  it('retourne 404', async () => {
    prisma.paiement.findUnique.mockResolvedValue(null);

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

describe('DELETE /api/paiements/[id]', () => {
  it('supprime un paiement', async () => {
    prisma.paiement.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
