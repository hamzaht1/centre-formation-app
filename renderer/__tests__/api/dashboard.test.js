/**
 * Tests API Dashboard
 */
const prisma = require('../../__tests__/helpers/prisma-mock');
jest.mock('../../lib/prisma', () => require('../helpers/prisma-mock'));
jest.mock('../../lib/auth', () => require('../helpers/auth-mock'));

const { callHandler } = require('../helpers/api-helper');

const statsHandler = require('../../pages/api/dashboard/stats').default;

beforeEach(() => {
  prisma.__resetAll();
});

describe('GET /api/dashboard/stats', () => {
  it('retourne les statistiques', async () => {
    prisma.stagiaire.count.mockResolvedValue(25);
    prisma.session.count.mockResolvedValue(3);
    prisma.formateur.count.mockResolvedValue(5);
    prisma.formation.count.mockResolvedValue(10);
    prisma.presence.count
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(80); // present
    prisma.inscription.count.mockResolvedValue(12);
    prisma.paiement.aggregate.mockResolvedValue({ _sum: { montant: 5000 } });
    prisma.session.findMany.mockResolvedValue([
      { id: 1, nom: 'Session A', dateDebut: new Date('2025-06-01') },
    ]);

    const { statusCode, body } = await callHandler(statsHandler, {
      method: 'GET',
    });

    expect(statusCode).toBe(200);
    expect(body.stagiaires).toBe(25);
    expect(body.sessionsEnCours).toBe(3);
    expect(body.formateurs).toBe(5);
    expect(body.formations).toBe(10);
    expect(body.tauxPresence).toBe(80);
    expect(body.nouvellesInscriptions).toBe(12);
    expect(body.revenusMois).toBe(5000);
    expect(body.sessionsAVenir).toHaveLength(1);
  });

  it('gère le cas où aucune présence', async () => {
    prisma.stagiaire.count.mockResolvedValue(0);
    prisma.session.count.mockResolvedValue(0);
    prisma.formateur.count.mockResolvedValue(0);
    prisma.formation.count.mockResolvedValue(0);
    prisma.presence.count.mockResolvedValue(0);
    prisma.inscription.count.mockResolvedValue(0);
    prisma.paiement.aggregate.mockResolvedValue({ _sum: { montant: null } });
    prisma.session.findMany.mockResolvedValue([]);

    const { statusCode, body } = await callHandler(statsHandler, {
      method: 'GET',
    });

    expect(statusCode).toBe(200);
    expect(body.tauxPresence).toBe(0);
    expect(body.revenusMois).toBe(0);
  });

  it('retourne 405 pour POST', async () => {
    const { statusCode } = await callHandler(statsHandler, { method: 'POST' });
    expect(statusCode).toBe(405);
  });
});
