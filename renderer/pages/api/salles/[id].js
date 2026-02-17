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
      const salle = await prisma.salle.findUnique({
        where: { id: parsedId },
        include: {
          sessions: {
            include: {
              formation: true,
              formateur: true,
            },
            orderBy: {
              dateDebut: 'desc',
            },
          },
          planning: {
            include: {
              session: {
                include: {
                  formation: true,
                },
              },
              formateur: true,
            },
            orderBy: {
              date: 'asc',
            },
            take: 20,
          },
          _count: {
            select: {
              sessions: true,
              planning: true,
            },
          },
        },
      });

      if (!salle) {
        return res.status(404).json({ error: 'Salle non trouvée' });
      }

      res.status(200).json(salle);
    } catch (error) {
      console.error('Erreur GET salle:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { capacite, ...otherData } = req.body;

      const salle = await prisma.salle.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          capacite: capacite !== undefined ? parseInt(capacite) : undefined,
        },
      });

      res.status(200).json(salle);
    } catch (error) {
      console.error('Erreur PUT salle:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Une salle avec ce nom existe déjà',
        });
      }

      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const sessionsCount = await prisma.session.count({
        where: { salleId: parsedId },
      });

      if (sessionsCount > 0) {
        return res.status(400).json({
          error: 'Impossible de supprimer une salle utilisée dans des sessions',
        });
      }

      await prisma.planning.deleteMany({
        where: { salleId: parsedId },
      });

      await prisma.salle.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Salle supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE salle:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
