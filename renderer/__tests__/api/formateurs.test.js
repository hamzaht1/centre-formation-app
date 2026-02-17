/**
 * Tests API Formateurs
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const indexHandler = require('../../pages/api/formateurs/index').default;
const idHandler = require('../../pages/api/formateurs/[id]').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/formateurs', () => {
  it('retourne la liste', async () => {
    prisma.formateur.findMany.mockResolvedValue([{ id: 1, nom: 'Prof A' }]);

    const { statusCode, body } = await callHandler(indexHandler, {
      method: 'GET',
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body).toHaveLength(1);
  });

  it('filtre par recherche', async () => {
    prisma.formateur.findMany.mockResolvedValue([]);

    await callHandler(indexHandler, {
      method: 'GET',
      query: { search: 'Martin' },
    });

    expect(prisma.formateur.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { nom: { contains: 'Martin' } },
          ]),
        }),
      })
    );
  });
});

describe('POST /api/formateurs', () => {
  it('crée un formateur valide', async () => {
    prisma.formateur.create.mockResolvedValue({ id: 1, nom: 'Martin', prenom: 'Paul' });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Martin', prenom: 'Paul' },
    });

    expect(statusCode).toBe(201);
  });

  it('rejette si nom/prenom manquants', async () => {
    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: { nom: 'Martin' },
    });

    expect(statusCode).toBe(400);
  });

  it('crée avec disponibilités', async () => {
    prisma.formateur.create.mockResolvedValue({ id: 1 });

    const { statusCode } = await callHandler(indexHandler, {
      method: 'POST',
      body: {
        nom: 'Martin',
        prenom: 'Paul',
        disponibilites: [
          { jourSemaine: 1, heureDebut: '09:00', heureFin: '12:00' },
        ],
      },
    });

    expect(statusCode).toBe(201);
  });
});

describe('GET /api/formateurs/[id]', () => {
  it('retourne un formateur', async () => {
    prisma.formateur.findUnique.mockResolvedValue({ id: 1, nom: 'Martin' });

    const { statusCode } = await callHandler(idHandler, {
      method: 'GET',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });

  it('retourne 404', async () => {
    prisma.formateur.findUnique.mockResolvedValue(null);

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

describe('DELETE /api/formateurs/[id]', () => {
  it('empêche suppression si formateur principal', async () => {
    prisma.session.count.mockResolvedValue(2);

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(400);
  });

  it('supprime si pas formateur principal', async () => {
    prisma.session.count.mockResolvedValue(0);
    prisma.formateur.delete.mockResolvedValue({});

    const { statusCode } = await callHandler(idHandler, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(statusCode).toBe(200);
  });
});
