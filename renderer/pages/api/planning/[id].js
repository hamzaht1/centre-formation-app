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
      const planning = await prisma.planning.findUnique({
        where: { id: parsedId },
        include: {
          session: {
            include: {
              formation: true,
            },
          },
          formateur: true,
          salle: true,
        },
      });

      if (!planning) {
        return res.status(404).json({ error: 'Planning non trouvé' });
      }

      res.status(200).json(planning);
    } catch (error) {
      console.error('Erreur GET planning:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        date,
        sessionId,
        formateurId,
        heureDebut,
        heureFin,
        ...otherData
      } = req.body;

      const planning = await prisma.planning.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          date: date ? new Date(date) : undefined,
          sessionId: sessionId ? parseInt(sessionId) : undefined,
          formateurId: formateurId ? parseInt(formateurId) : undefined,
          // Fix: use !== undefined instead of || to handle "0:00" correctly
          heureDebut: heureDebut !== undefined ? heureDebut : undefined,
          heureFin: heureFin !== undefined ? heureFin : undefined,
        },
        include: {
          session: {
            include: {
              formation: true,
            },
          },
          formateur: true,
          salle: true,
        },
      });

      res.status(200).json(planning);
    } catch (error) {
      console.error('Erreur PUT planning:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.planning.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Planning supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE planning:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
