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
      const presence = await prisma.presence.findUnique({
        where: { id: parsedId },
        include: {
          stagiaire: true,
          session: {
            include: {
              formation: true,
            },
          },
        },
      });

      if (!presence) {
        return res.status(404).json({ error: 'Présence non trouvée' });
      }

      res.status(200).json(presence);
    } catch (error) {
      console.error('Erreur GET présence:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { date, stagiaireId, sessionId, ...otherData } = req.body;

      const presence = await prisma.presence.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          date: date ? new Date(date) : undefined,
          stagiaireId: stagiaireId ? parseInt(stagiaireId) : undefined,
          sessionId: sessionId ? parseInt(sessionId) : undefined,
        },
        include: {
          stagiaire: true,
          session: true,
        },
      });

      res.status(200).json(presence);
    } catch (error) {
      console.error('Erreur PUT présence:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.presence.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Présence supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE présence:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
