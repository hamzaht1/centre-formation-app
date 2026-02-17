import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const [
        stagiaires,
        sessionsEnCours,
        formateurs,
        formations,
        totalPresences,
        presencesPresent,
        nouvellesInscriptions,
        paiementsMois,
        sessionsAVenir,
      ] = await Promise.all([
        prisma.stagiaire.count({ where: { statut: 'actif' } }),
        prisma.session.count({ where: { statut: 'en_cours' } }),
        prisma.formateur.count({ where: { statut: 'actif' } }),
        prisma.formation.count({ where: { statut: 'active' } }),
        prisma.presence.count(),
        prisma.presence.count({ where: { statut: 'present' } }),
        (() => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return prisma.inscription.count({
            where: { dateInscription: { gte: thirtyDaysAgo } },
          });
        })(),
        (() => {
          const firstDayOfMonth = new Date();
          firstDayOfMonth.setDate(1);
          firstDayOfMonth.setHours(0, 0, 0, 0);
          return prisma.paiement.aggregate({
            where: { datePaiement: { gte: firstDayOfMonth } },
            _sum: { montant: true },
          });
        })(),
        prisma.session.findMany({
          where: {
            statut: 'a_venir',
            dateDebut: { gte: new Date() },
          },
          include: {
            formation: true,
            formateur: true,
            _count: { select: { inscriptions: true } },
          },
          orderBy: { dateDebut: 'asc' },
          take: 5,
        }),
      ]);

      const tauxPresence =
        totalPresences > 0
          ? Math.round((presencesPresent / totalPresences) * 100)
          : 0;

      const revenusMois = paiementsMois._sum.montant || 0;

      res.status(200).json({
        stagiaires,
        sessionsEnCours,
        formateurs,
        formations,
        tauxPresence,
        nouvellesInscriptions,
        revenusMois,
        sessionsAVenir,
      });
    } catch (error) {
      console.error('Erreur API stats:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
