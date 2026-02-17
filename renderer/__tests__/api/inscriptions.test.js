/**
 * Tests API Inscriptions
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/inscriptions/index').default;
const idHandler = require('../../pages/api/inscriptions/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/inscriptions', () => {
  it('retourne la liste paginée', async () => {
    const mockData = [{ id: 1 }];
    prisma.inscription.findMany.mockResolvedValue(mockData);
    prisma.inscription.count.mockResolvedValue(1);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.data).toEqual(mockData);
  });

  it('filtre par stagiaireId', async () => {
    prisma.inscription.findMany.mockResolvedValue([]);
    prisma.inscription.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { stagiaireId: '1' },
    });

    expect(prisma.inscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stagiaireId: 1 }),
      })
    );
  });
});

describe('POST /api/inscriptions', () => {
  it('crée une inscription valide', async () => {
    const mockSession = { id: 1, capaciteMax: 20, _count: { inscriptions: 5 } };
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        session: { findUnique: jest.fn().mockResolvedValue(mockSession) },
        inscription: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 1, stagiaireId: 1, sessionId: 1 }),
        },
      };
      return fn(tx);
    });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, sessionId: 1, montantTotal: 500 },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si champs requis manquants', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1 },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette si session complète', async () => {
    const fullSession = { id: 1, capaciteMax: 2, _count: { inscriptions: 2 } };
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        session: { findUnique: jest.fn().mockResolvedValue(fullSession) },
        inscription: { findFirst: jest.fn(), create: jest.fn() },
      };
      return fn(tx);
    });

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, sessionId: 1, montantTotal: 500 },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/complète/);
  });

  it('rejette doublon stagiaire', async () => {
    const mockSession = { id: 1, capaciteMax: 20, _count: { inscriptions: 5 } };
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        session: { findUnique: jest.fn().mockResolvedValue(mockSession) },
        inscription: {
          findFirst: jest.fn().mockResolvedValue({ id: 99 }),
          create: jest.fn(),
        },
      };
      return fn(tx);
    });

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, sessionId: 1, montantTotal: 500 },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/déjà inscrit/);
  });

  it('rejette si session non trouvée', async () => {
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        session: { findUnique: jest.fn().mockResolvedValue(null) },
        inscription: { findFirst: jest.fn(), create: jest.fn() },
      };
      return fn(tx);
    });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { stagiaireId: 1, sessionId: 999, montantTotal: 500 },
    });

    expect(statusCode).toBe(404);
  });
});

describe('GET /api/inscriptions/[id]', () => {
  it('retourne une inscription', async () => {
    prisma.inscription.findUnique.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });

  it('retourne 404', async () => {
    prisma.inscription.findUnique.mockResolvedValue(null);

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '999' },
    });

    expect(statusCode).toBe(404);
  });
});

describe('PUT /api/inscriptions/[id]', () => {
  it('met à jour avec !== undefined pour montants', async () => {
    prisma.inscription.findUnique.mockResolvedValue({ id: 1, montantPaye: 0, stagiaireId: 1 });
    prisma.inscription.update.mockResolvedValue({ id: 1, montantPaye: 0 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { montantPaye: 0 },
    });

    expect(statusCode).toBe(200);
  });

  it('crée un paiement quand montantPaye augmente', async () => {
    prisma.inscription.findUnique.mockResolvedValue({ id: 1, montantPaye: 100, stagiaireId: 5 });
    prisma.inscription.update.mockResolvedValue({ id: 1, montantPaye: 250 });
    prisma.paiement.create.mockResolvedValue({ id: 10 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { montantPaye: 250, modePaiement: 'cheque' },
    });

    expect(statusCode).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.paiement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stagiaireId: 5,
        montant: 150,
        modePaiement: 'cheque',
        remarques: 'Paiement inscription #1',
      }),
    });
  });

  it('ne crée pas de paiement quand montantPaye reste identique', async () => {
    prisma.inscription.findUnique.mockResolvedValue({ id: 1, montantPaye: 200, stagiaireId: 5 });
    prisma.inscription.update.mockResolvedValue({ id: 1, montantPaye: 200 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { montantPaye: 200 },
    });

    expect(statusCode).toBe(200);
    expect(prisma.paiement.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ne crée pas de paiement quand montantPaye diminue', async () => {
    prisma.inscription.findUnique.mockResolvedValue({ id: 1, montantPaye: 300, stagiaireId: 5 });
    prisma.inscription.update.mockResolvedValue({ id: 1, montantPaye: 150 });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { montantPaye: 150 },
    });

    expect(statusCode).toBe(200);
    expect(prisma.paiement.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/inscriptions/[id]', () => {
  it('supprime une inscription', async () => {
    prisma.inscription.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
