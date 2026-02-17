import prisma from '../../../../lib/prisma';
import { verifyAuth } from '../../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  const { sessionId } = req.query;

  if (req.method === 'GET') {
    try {
      const planning = await prisma.planning.findMany({
        where: {
          sessionId: parseInt(sessionId),
        },
        include: {
          formateur: true,
          session: {
            include: {
              formation: true,
            },
          },
        },
        orderBy: [
          {
            date: 'asc',
          },
          {
            heureDebut: 'asc',
          },
        ],
      });

      res.status(200).json(planning);
    } catch (error) {
      console.error('Erreur GET planning session:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}