import prisma from '../../../lib/prisma';
import { validateRequired, validatePositiveNumber } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { search, formationId } = req.query;

      const where = {};

      if (search) {
        where.OR = [
          { nom: { contains: search } },
          { formation: { nom: { contains: search } } },
        ];
      }

      if (formationId) {
        const parsed = parseInt(formationId, 10);
        if (isNaN(parsed) || parsed <= 0) {
          return res.status(400).json({ error: 'formationId invalide' });
        }
        where.formationId = parsed;
      }

      const livres = await prisma.livre.findMany({
        where,
        include: {
          formation: true,
        },
        orderBy: {
          nom: 'asc',
        },
      });

      res.status(200).json(livres);
    } catch (error) {
      console.error('Erreur GET livres:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { nom, prix, formationId, quantite } = req.body;

      const check = validateRequired(['nom', 'formationId'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const parsedFormationId = parseInt(formationId, 10);
      if (isNaN(parsedFormationId) || parsedFormationId <= 0) {
        return res.status(400).json({ error: 'formationId invalide' });
      }

      if (prix !== undefined && prix !== null && prix !== '') {
        const prixCheck = validatePositiveNumber(prix, 'prix', { allowZero: true });
        if (!prixCheck.valid) {
          return res.status(400).json({ error: prixCheck.error });
        }
      }

      if (quantite !== undefined && quantite !== null && quantite !== '') {
        const qtyCheck = validatePositiveNumber(quantite, 'quantite', { allowZero: true });
        if (!qtyCheck.valid) {
          return res.status(400).json({ error: qtyCheck.error });
        }
      }

      // Vérifier max 2 livres par formation
      const existingCount = await prisma.livre.count({
        where: { formationId: parsedFormationId },
      });

      if (existingCount >= 2) {
        return res.status(400).json({
          error: 'Cette formation a déjà 2 livres (maximum autorisé)',
        });
      }

      const livre = await prisma.livre.create({
        data: {
          nom,
          prix: prix !== undefined && prix !== null && prix !== '' ? parseFloat(prix) : 0,
          quantite: quantite !== undefined && quantite !== null && quantite !== '' ? parseInt(quantite, 10) : 0,
          formationId: parsedFormationId,
        },
        include: {
          formation: true,
        },
      });

      res.status(201).json(livre);
    } catch (error) {
      console.error('Erreur POST livre:', error);

      if (error.code === 'P2003') {
        return res.status(400).json({
          error: 'Formation non trouvée',
        });
      }

      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
