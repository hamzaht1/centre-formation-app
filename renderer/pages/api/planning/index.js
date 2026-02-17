import prisma from '../../../lib/prisma';
import { validateRequired, validateTimeRange } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { sessionId, formateurId, salleId, dateDebut, dateFin } = req.query;

      const where = {};

      if (sessionId) {
        where.sessionId = parseInt(sessionId);
      }

      if (formateurId) {
        where.formateurId = parseInt(formateurId);
      }

      if (salleId) {
        where.salleId = parseInt(salleId);
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

      const planning = await prisma.planning.findMany({
        where,
        include: {
          session: {
            include: {
              formation: true,
            },
          },
          formateur: true,
          salle: true,
        },
        orderBy: [
          { date: 'asc' },
          { heureDebut: 'asc' },
        ],
      });

      res.status(200).json(planning);
    } catch (error) {
      console.error('Erreur GET planning:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        date,
        sessionId,
        formateurId,
        heureDebut,
        heureFin,
        ...otherData
      } = req.body;

      const check = validateRequired(
        ['date', 'sessionId', 'formateurId', 'heureDebut', 'heureFin'],
        req.body
      );
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const timeCheck = validateTimeRange(heureDebut, heureFin);
      if (!timeCheck.valid) {
        return res.status(400).json({ error: timeCheck.error });
      }

      // Normalize times for consistent comparison
      const normalizeTime = (t) => {
        const [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${m}`;
      };
      const normDebut = normalizeTime(heureDebut);
      const normFin = normalizeTime(heureFin);

      // Check for schedule conflicts
      const conflitFormateur = await prisma.planning.findFirst({
        where: {
          formateurId: parseInt(formateurId),
          date: new Date(date),
          statut: { not: 'annule' },
          OR: [
            {
              AND: [
                { heureDebut: { lte: normDebut } },
                { heureFin: { gt: normDebut } },
              ],
            },
            {
              AND: [
                { heureDebut: { lt: normFin } },
                { heureFin: { gte: normFin } },
              ],
            },
            {
              AND: [
                { heureDebut: { gte: normDebut } },
                { heureFin: { lte: normFin } },
              ],
            },
          ],
        },
      });

      if (conflitFormateur) {
        return res.status(400).json({
          error: "Conflit d'horaire pour le formateur",
        });
      }

      const planningItem = await prisma.planning.create({
        data: {
          ...otherData,
          date: new Date(date),
          sessionId: parseInt(sessionId),
          formateurId: parseInt(formateurId),
          heureDebut: normDebut,
          heureFin: normFin,
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

      res.status(201).json(planningItem);
    } catch (error) {
      console.error('Erreur POST planning:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
