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
      const paiement = await prisma.paiement.findUnique({
        where: { id: parsedId },
        include: {
          stagiaire: true,
          livresStagiaires: {
            include: {
              livre: { include: { formation: true } },
            },
          },
        },
      });

      if (!paiement) {
        return res.status(404).json({ error: 'Paiement non trouvé' });
      }

      res.status(200).json(paiement);
    } catch (error) {
      console.error('Erreur GET paiement:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.paiement.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Paiement supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE paiement:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
