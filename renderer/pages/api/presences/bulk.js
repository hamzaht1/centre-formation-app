import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

const MAX_BULK_SIZE = 500;

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'POST') {
    try {
      const { presences } = req.body;

      if (!presences || !Array.isArray(presences)) {
        return res.status(400).json({ error: 'Format de données invalide' });
      }

      if (presences.length === 0) {
        return res.status(400).json({ error: 'Le tableau de présences est vide' });
      }

      if (presences.length > MAX_BULK_SIZE) {
        return res.status(400).json({
          error: `Trop de présences (max ${MAX_BULK_SIZE}). Reçu: ${presences.length}`,
        });
      }

      const createdPresences = await prisma.presence.createMany({
        data: presences.map((p) => ({
          ...p,
          date: new Date(p.date),
          stagiaireId: parseInt(p.stagiaireId),
          sessionId: parseInt(p.sessionId),
        })),
      });

      res.status(201).json({
        message: `${createdPresences.count} présences enregistrées`,
        count: createdPresences.count,
      });
    } catch (error) {
      console.error('Erreur POST bulk présences:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
