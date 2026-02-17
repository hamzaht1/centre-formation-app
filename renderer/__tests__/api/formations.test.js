/**
 * Tests API Formations
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/formations/index').default;
const idHandler = require('../../pages/api/formations/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/formations', () => {
  it('retourne la liste paginée', async () => {
    const mockData = [{ id: 1, nom: 'Français A1' }];
    prisma.formation.findMany.mockResolvedValue(mockData);
    prisma.formation.count.mockResolvedValue(1);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.data).toEqual(mockData);
    expect(body.total).toBe(1);
  });

  it('filtre par catégorie', async () => {
    prisma.formation.findMany.mockResolvedValue([]);
    prisma.formation.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { categorie: 'langue' },
    });

    expect(prisma.formation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categorie: 'langue' }),
      })
    );
  });

  it('filtre par statut et typePublic', async () => {
    prisma.formation.findMany.mockResolvedValue([]);
    prisma.formation.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { statut: 'active', typePublic: 'adultes' },
    });

    expect(prisma.formation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ statut: 'active', typePublic: 'adultes' }),
      })
    );
  });
});

describe('POST /api/formations', () => {
  it('crée une formation valide', async () => {
    const newFormation = { id: 1, nom: 'Français', dureeHeures: 40, prix: 500 };
    prisma.formation.create.mockResolvedValue(newFormation);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Français', dureeHeures: '40', prix: '500' },
    });

    expect(statusCode).toBe(201);
    expect(body).toEqual(newFormation);
  });

  it('rejette si nom manquant', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { dureeHeures: '40', prix: '500' },
    });

    expect(statusCode).toBe(400);
  });

  it('rejette si dureeHeures est NaN', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Test', dureeHeures: 'abc', prix: '500' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/dureeHeures/);
  });

  it('rejette si prix est négatif', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Test', dureeHeures: '40', prix: '-10' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/prix/);
  });

  it('accepte prix à zéro', async () => {
    prisma.formation.create.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Test', dureeHeures: '40', prix: '0' },
    });

    expect(statusCode).toBe(201);
  });
});

describe('GET /api/formations/[id]', () => {
  it('retourne une formation avec stats', async () => {
    const mockFormation = {
      id: 1,
      nom: 'Français',
      sessions: [
        { statut: 'en_cours', _count: { inscriptions: 5 } },
        { statut: 'terminee', _count: { inscriptions: 10 } },
      ],
    };
    prisma.formation.findUnique.mockResolvedValue(mockFormation);

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
    expect(body.stats.totalSessions).toBe(2);
    expect(body.stats.sessionsEnCours).toBe(1);
    expect(body.stats.totalInscrits).toBe(15);
  });

  it('retourne 404 si non trouvée', async () => {
    prisma.formation.findUnique.mockResolvedValue(null);

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

describe('PUT /api/formations/[id]', () => {
  it('met à jour une formation', async () => {
    prisma.formation.update.mockResolvedValue({ id: 1, nom: 'Updated' });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { nom: 'Updated' },
    });

    expect(statusCode).toBe(200);
  });
});

describe('DELETE /api/formations/[id]', () => {
  it('empêche suppression si sessions existent', async () => {
    prisma.session.count.mockResolvedValue(3);

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/sessions/);
  });

  it('supprime si aucune session', async () => {
    prisma.session.count.mockResolvedValue(0);
    prisma.formation.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
