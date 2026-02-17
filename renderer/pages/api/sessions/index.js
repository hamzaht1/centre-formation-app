import prisma from '../../../lib/prisma';
import { validateRequired, validateDateRange } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { formationId, formateurId, statut } = req.query;

      const where = {};

      if (formationId) {
        where.formationId = parseInt(formationId);
      }

      if (formateurId) {
        where.formateurPrincipalId = parseInt(formateurId);
      }

      if (statut) {
        where.statut = statut;
      }

      const sessions = await prisma.session.findMany({
        where,
        include: {
          formation: true,
          formateur: true,
          _count: {
            select: {
              inscriptions: true,
              planning: true,
            },
          },
        },
        orderBy: {
          dateDebut: 'desc',
        },
      });

      res.status(200).json(sessions);
    } catch (error) {
      console.error('Erreur GET sessions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        dateDebut,
        dateFin,
        formationId,
        formateurPrincipalId,
        capaciteMax,
        ...otherData
      } = req.body;

      const check = validateRequired(['nom', 'formationId', 'dateDebut', 'dateFin'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const dateCheck = validateDateRange(dateDebut, dateFin);
      if (!dateCheck.valid) {
        return res.status(400).json({ error: dateCheck.error });
      }

      const session = await prisma.session.create({
        data: {
          ...otherData,
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          formationId: parseInt(formationId),
          formateurPrincipalId: formateurPrincipalId
            ? parseInt(formateurPrincipalId)
            : null,
          capaciteMax: capaciteMax ? parseInt(capaciteMax) : 20,
        },
        include: {
          formation: true,
          formateur: true,
        },
      });

      res.status(201).json(session);
    } catch (error) {
      console.error('Erreur POST session:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
