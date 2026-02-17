import prisma from '../../../lib/prisma';
import { validateId, handlePrismaError } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  const { id } = req.query;

  const idCheck = validateId(id);
  if (!idCheck.valid) {
    return res.status(400).json({ error: idCheck.error });
  }
  const parsedId = idCheck.id;

  if (req.method === 'GET') {
    try {
      const formation = await prisma.formation.findUnique({
        where: { id: parsedId },
        include: {
          sessions: {
            include: {
              formateur: true,
              _count: {
                select: { inscriptions: true },
              },
            },
            orderBy: {
              dateDebut: 'desc',
            },
          },
        },
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation non trouvée' });
      }

      const totalSessions = formation.sessions.length;
      const sessionsEnCours = formation.sessions.filter(
        (s) => s.statut === 'en_cours'
      ).length;
      const totalInscrits = formation.sessions.reduce(
        (sum, s) => sum + s._count.inscriptions,
        0
      );

      const stats = {
        totalSessions,
        sessionsEnCours,
        totalInscrits,
      };

      res.status(200).json({ ...formation, stats });
    } catch (error) {
      console.error('Erreur GET formation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { dureeHeures, prix, ...otherData } = req.body;

      const formation = await prisma.formation.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          dureeHeures: dureeHeures !== undefined ? parseInt(dureeHeures) : undefined,
          prix: prix !== undefined ? parseFloat(prix) : undefined,
        },
      });

      res.status(200).json(formation);
    } catch (error) {
      console.error('Erreur PUT formation:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const sessionsCount = await prisma.session.count({
        where: { formationId: parsedId },
      });

      if (sessionsCount > 0) {
        return res.status(400).json({
          error: 'Impossible de supprimer une formation avec des sessions',
        });
      }

      await prisma.formation.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Formation supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE formation:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
