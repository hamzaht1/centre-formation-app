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
      const formateur = await prisma.formateur.findUnique({
        where: { id: parsedId },
        include: {
          sessions: {
            include: {
              formation: true,
              _count: {
                select: { inscriptions: true },
              },
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
            },
            orderBy: {
              date: 'asc',
            },
            take: 20,
          },
        },
      });

      if (!formateur) {
        return res.status(404).json({ error: 'Formateur non trouvé' });
      }

      res.status(200).json(formateur);
    } catch (error) {
      console.error('Erreur GET formateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { dateEmbauche, ...otherData } = req.body;

      const formateur = await prisma.formateur.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : undefined,
        },
      });

      res.status(200).json(formateur);
    } catch (error) {
      console.error('Erreur PUT formateur:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const sessionsCount = await prisma.session.count({
        where: { formateurPrincipalId: parsedId },
      });

      if (sessionsCount > 0) {
        return res.status(400).json({
          error:
            'Impossible de supprimer un formateur principal de session(s)',
        });
      }

      await prisma.planning.deleteMany({
        where: { formateurId: parsedId },
      });

      await prisma.formateur.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Formateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE formateur:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
