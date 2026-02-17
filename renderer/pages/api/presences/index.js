import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { sessionId, stagiaireId, dateDebut, dateFin, statut, page, limit } =
        req.query;

      const where = {};

      if (sessionId) {
        where.sessionId = parseInt(sessionId);
      }

      if (stagiaireId) {
        where.stagiaireId = parseInt(stagiaireId);
      }

      if (statut) {
        where.statut = statut;
      }

      if (dateDebut || dateFin) {
        where.date = {};
        if (dateDebut) {
          where.date.gte = new Date(dateDebut);
        }
        if (dateFin) {
          where.date.lte = new Date(dateFin);
        }
      }

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [presences, total] = await Promise.all([
        prisma.presence.findMany({
          where,
          include: {
            stagiaire: true,
            session: {
              include: {
                formation: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take,
          skip,
        }),
        prisma.presence.count({ where }),
      ]);

      res.status(200).json({ data: presences, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET présences:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { date, stagiaireId, sessionId, ...otherData } = req.body;

      const presence = await prisma.presence.create({
        data: {
          ...otherData,
          date: new Date(date),
          stagiaireId: parseInt(stagiaireId),
          sessionId: parseInt(sessionId),
        },
        include: {
          stagiaire: true,
          session: true,
        },
      });

      res.status(201).json(presence);
    } catch (error) {
      console.error('Erreur POST présence:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
