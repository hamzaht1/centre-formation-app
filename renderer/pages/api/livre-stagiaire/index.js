import prisma from '../../../lib/prisma';
import { validateRequired, validateId, validatePositiveNumber } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { stagiaireId, livreId, inscriptionId, paye, page, limit } = req.query;

      const where = {};

      if (stagiaireId) {
        const check = validateId(stagiaireId);
        if (!check.valid) return res.status(400).json({ error: 'stagiaireId invalide' });
        where.stagiaireId = check.id;
      }

      if (livreId) {
        const check = validateId(livreId);
        if (!check.valid) return res.status(400).json({ error: 'livreId invalide' });
        where.livreId = check.id;
      }

      if (inscriptionId) {
        const check = validateId(inscriptionId);
        if (!check.valid) return res.status(400).json({ error: 'inscriptionId invalide' });
        where.inscriptionId = check.id;
      }

      if (paye === 'true') {
        where.paiementId = { not: null };
      } else if (paye === 'false') {
        where.paiementId = null;
      }

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [data, total] = await Promise.all([
        prisma.livreStagiaire.findMany({
          where,
          include: {
            livre: { include: { formation: true } },
            stagiaire: true,
            paiement: true,
          },
          orderBy: { dateAttribution: 'desc' },
          take,
          skip,
        }),
        prisma.livreStagiaire.count({ where }),
      ]);

      res.status(200).json({ data, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET livre-stagiaire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { livreId, stagiaireId, inscriptionId, remarques } = req.body;

      const check = validateRequired(['livreId', 'stagiaireId'], req.body);
      if (!check.valid) {
        return res.status(400).json({ error: `Champs requis manquants: ${check.missing.join(', ')}` });
      }

      const livreIdCheck = validateId(livreId);
      if (!livreIdCheck.valid) return res.status(400).json({ error: 'livreId invalide' });

      const stagiaireIdCheck = validateId(stagiaireId);
      if (!stagiaireIdCheck.valid) return res.status(400).json({ error: 'stagiaireId invalide' });

      const result = await prisma.$transaction(async (tx) => {
        const livre = await tx.livre.findUnique({ where: { id: livreIdCheck.id } });
        if (!livre) throw { statusCode: 404, message: 'Livre non trouvé' };

        if (livre.quantite <= 0) {
          throw { statusCode: 400, message: 'Stock insuffisant pour ce livre' };
        }

        const stagiaire = await tx.stagiaire.findUnique({ where: { id: stagiaireIdCheck.id } });
        if (!stagiaire) throw { statusCode: 404, message: 'Stagiaire non trouvé' };

        const livreStagiaire = await tx.livreStagiaire.create({
          data: {
            livreId: livreIdCheck.id,
            stagiaireId: stagiaireIdCheck.id,
            inscriptionId: inscriptionId ? parseInt(inscriptionId, 10) : null,
            prixUnitaire: livre.prix,
            remarques: remarques || null,
          },
          include: {
            livre: { include: { formation: true } },
            stagiaire: true,
          },
        });

        await tx.livre.update({
          where: { id: livreIdCheck.id },
          data: { quantite: { decrement: 1 } },
        });

        return livreStagiaire;
      });

      res.status(201).json(result);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ce livre est déjà attribué à ce stagiaire pour cette inscription' });
      }
      console.error('Erreur POST livre-stagiaire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
