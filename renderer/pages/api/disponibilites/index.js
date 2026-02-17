import prisma from '../../../lib/prisma';
import { validateRequired } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { formateurId, actif } = req.query;

      const where = {};

      if (formateurId) {
        where.formateurId = parseInt(formateurId);
      }

      if (actif !== undefined) {
        where.actif = actif === 'true';
      }

      const disponibilites = await prisma.disponibilite.findMany({
        where,
        include: {
          formateur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
        orderBy: [
          { jourSemaine: 'asc' },
          { heureDebut: 'asc' },
        ],
      });

      res.status(200).json(disponibilites);
    } catch (error) {
      console.error('Erreur GET disponibilités:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { formateurId, disponibilites } = req.body;

      const check = validateRequired(['formateurId', 'disponibilites'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      if (!Array.isArray(disponibilites) || disponibilites.length === 0) {
        return res.status(400).json({ error: 'Le tableau de disponibilités est invalide' });
      }

      const created = await prisma.disponibilite.createMany({
        data: disponibilites.map((dispo) => ({
          formateurId: parseInt(formateurId),
          jourSemaine: dispo.jourSemaine,
          heureDebut: dispo.heureDebut,
          heureFin: dispo.heureFin,
          typeRecurrence: dispo.typeRecurrence || 'hebdomadaire',
          dateDebut: dispo.dateDebut ? new Date(dispo.dateDebut) : null,
          dateFin: dispo.dateFin ? new Date(dispo.dateFin) : null,
          actif: dispo.actif !== undefined ? dispo.actif : true,
          remarques: dispo.remarques || null,
        })),
      });

      res.status(201).json(created);
    } catch (error) {
      console.error('Erreur POST disponibilité:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
