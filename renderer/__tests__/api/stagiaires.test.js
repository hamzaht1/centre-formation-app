/**
 * Tests API Stagiaires
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/stagiaires/index').default;
const idHandler = require('../../pages/api/stagiaires/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/stagiaires', () => {
  it('retourne la liste paginée', async () => {
    const mockData = [
      { id: 1, nom: 'Dupont', prenom: 'Jean' },
      { id: 2, nom: 'Martin', prenom: 'Marie' },
    ];
    prisma.stagiaire.findMany.mockResolvedValue(mockData);
    prisma.stagiaire.count.mockResolvedValue(2);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.data).toEqual(mockData);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('filtre par statut', async () => {
    prisma.stagiaire.findMany.mockResolvedValue([]);
    prisma.stagiaire.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { statut: 'actif' },
    });

    expect(prisma.stagiaire.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { statut: 'actif' },
      })
    );
  });

  it('supporte la recherche', async () => {
    prisma.stagiaire.findMany.mockResolvedValue([]);
    prisma.stagiaire.count.mockResolvedValue(0);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { search: 'Dupont' },
    });

    expect(prisma.stagiaire.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { nom: { contains: 'Dupont' } },
          ]),
        }),
      })
    );
  });

  it('respecte la pagination', async () => {
    prisma.stagiaire.findMany.mockResolvedValue([]);
    prisma.stagiaire.count.mockResolvedValue(100);

    const { body } = await callHandler(indexHandler, {
      method: 'GET',
      query: { page: '2', limit: '10' },
    });

    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
    expect(prisma.stagiaire.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 10 })
    );
  });
});

describe('POST /api/stagiaires', () => {
  it('crée un stagiaire valide', async () => {
    const newStagiaire = { id: 1, nom: 'Dupont', prenom: 'Jean' };
    prisma.stagiaire.create.mockResolvedValue(newStagiaire);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Dupont', prenom: 'Jean' },
    });

    expect(statusCode).toBe(201);
    expect(body).toEqual(newStagiaire);
  });

  it('rejette si nom manquant', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { prenom: 'Jean' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/nom/);
  });

  it('rejette si prenom manquant', async () => {
    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Dupont' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/prenom/);
  });

  it('gère dateNaissance correctement', async () => {
    prisma.stagiaire.create.mockResolvedValue({ id: 1 });

    await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Dupont', prenom: 'Jean', dateNaissance: '2000-01-01' },
    });

    expect(prisma.stagiaire.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dateNaissance: new Date('2000-01-01'),
        }),
      })
    );
  });
});

describe('GET /api/stagiaires/[id]', () => {
  it('retourne un stagiaire trouvé', async () => {
    const mockStagiaire = {
      id: 1, nom: 'Dupont', prenom: 'Jean',
      presences: [{ statut: 'present' }, { statut: 'absent' }],
      paiements: [{ montant: 100 }, { montant: 200 }],
      inscriptions: [{ id: 1 }],
      livresStagiaires: [{ id: 1, paiementId: null, prixUnitaire: 25 }],
    };
    prisma.stagiaire.findUnique.mockResolvedValue(mockStagiaire);

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
    expect(body.stats.totalPaye).toBe(300);
    expect(body.stats.tauxPresence).toBe(50);
  });

  it('retourne 404 si non trouvé', async () => {
    prisma.stagiaire.findUnique.mockResolvedValue(null);

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '999' },
    });

    expect(statusCode).toBe(404);
  });

  it('retourne 400 si id invalide', async () => {
    const { statusCode, body } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: 'abc' },
    });

    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/ID/i);
  });

  it('retourne 400 si id négatif', async () => {
    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '-1' },
    });

    expect(statusCode).toBe(400);
  });
});

describe('PUT /api/stagiaires/[id]', () => {
  it('met à jour un stagiaire', async () => {
    const updated = { id: 1, nom: 'Durand', prenom: 'Jean' };
    prisma.stagiaire.update.mockResolvedValue(updated);

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '1' },
      body: { nom: 'Durand' },
    });

    expect(statusCode).toBe(200);
    expect(body.nom).toBe('Durand');
  });

  it('gère P2025 (not found) comme 404', async () => {
    prisma.stagiaire.update.mockRejectedValue({ code: 'P2025' });

    const { statusCode } = await callHandler(idHandler, {
      method: 'PUT',
      query: { id: '999' },
      body: { nom: 'Test' },
    });

    expect(statusCode).toBe(404);
  });
});

describe('DELETE /api/stagiaires/[id]', () => {
  it('supprime un stagiaire et ses dépendances', async () => {
    prisma.stagiaire.delete.mockResolvedValue({});

    const { statusCode, body } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
    expect(body.message).toMatch(/supprimé/);
    expect(prisma.presence.deleteMany).toHaveBeenCalled();
    expect(prisma.paiement.deleteMany).toHaveBeenCalled();
    expect(prisma.inscription.deleteMany).toHaveBeenCalled();
  });
});

describe('Méthode non autorisée', () => {
  it('retourne 405 pour PATCH', async () => {
    const { statusCode } = await callHandler(indexHandler, { method: 'PATCH' });
    expect(statusCode).toBe(405);
  });
});
