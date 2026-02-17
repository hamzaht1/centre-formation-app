import prisma from '../../../lib/prisma';
import { validateId, validatePositiveNumber, handlePrismaError } from '../../../lib/validation';
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
      const livre = await prisma.livre.findUnique({
        where: { id: parsedId },
        include: {
          formation: true,
          livresStagiaires: {
            include: {
              stagiaire: true,
              paiement: true,
            },
            orderBy: { dateAttribution: 'desc' },
          },
        },
      });

      if (!livre) {
        return res.status(404).json({ error: 'Livre non trouvé' });
      }

      res.status(200).json(livre);
    } catch (error) {
      console.error('Erreur GET livre:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { nom, prix, formationId, quantite } = req.body;

      const data = {};
      if (nom !== undefined) data.nom = nom;
      if (prix !== undefined && prix !== null && prix !== '') {
        data.prix = parseFloat(prix);
      }
      if (quantite !== undefined && quantite !== null && quantite !== '') {
        const qtyCheck = validatePositiveNumber(quantite, 'quantite', { allowZero: true });
        if (!qtyCheck.valid) {
          return res.status(400).json({ error: qtyCheck.error });
        }
        data.quantite = parseInt(quantite, 10);
      }

      if (formationId !== undefined) {
        const parsedFormationId = parseInt(formationId, 10);
        if (isNaN(parsedFormationId) || parsedFormationId <= 0) {
          return res.status(400).json({ error: 'formationId invalide' });
        }

        // Vérifier max 2 livres si changement de formation
        const existingCount = await prisma.livre.count({
          where: {
            formationId: parsedFormationId,
            id: { not: parsedId },
          },
        });

        if (existingCount >= 2) {
          return res.status(400).json({
            error: 'Cette formation a déjà 2 livres (maximum autorisé)',
          });
        }

        data.formationId = parsedFormationId;
      }

      const livre = await prisma.livre.update({
        where: { id: parsedId },
        data,
        include: {
          formation: true,
        },
      });

      res.status(200).json(livre);
    } catch (error) {
      console.error('Erreur PUT livre:', error);

      if (error.code === 'P2003') {
        return res.status(400).json({ error: 'Formation non trouvée' });
      }

      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.livreStagiaire.deleteMany({
        where: { livreId: parsedId },
      });

      await prisma.livre.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Livre supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE livre:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
