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
      const livreStagiaire = await prisma.livreStagiaire.findUnique({
        where: { id: parsedId },
        include: {
          livre: { include: { formation: true } },
          stagiaire: true,
          paiement: true,
        },
      });

      if (!livreStagiaire) {
        return res.status(404).json({ error: 'Attribution non trouvée' });
      }

      res.status(200).json(livreStagiaire);
    } catch (error) {
      console.error('Erreur GET livre-stagiaire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const livreStagiaire = await tx.livreStagiaire.findUnique({
          where: { id: parsedId },
        });

        if (!livreStagiaire) {
          throw { statusCode: 404, message: 'Attribution non trouvée' };
        }

        if (livreStagiaire.paiementId) {
          throw { statusCode: 400, message: 'Impossible de supprimer une attribution déjà payée' };
        }

        await tx.livreStagiaire.delete({ where: { id: parsedId } });

        await tx.livre.update({
          where: { id: livreStagiaire.livreId },
          data: { quantite: { increment: 1 } },
        });

        return { message: 'Attribution supprimée et stock restauré' };
      });

      res.status(200).json(result);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erreur DELETE livre-stagiaire:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
