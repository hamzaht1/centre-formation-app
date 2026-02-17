import prisma from '../../../lib/prisma';
import {
  validateRequired,
  validatePositiveNumber,
  validateEnum,
} from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { stagiaireId, dateDebut, dateFin, typePaiement, page, limit } = req.query;

      const where = {};

      if (stagiaireId) {
        where.stagiaireId = parseInt(stagiaireId);
      }

      if (typePaiement) {
        where.typePaiement = typePaiement;
      }

      if (dateDebut || dateFin) {
        where.datePaiement = {};
        if (dateDebut) {
          where.datePaiement.gte = new Date(dateDebut);
        }
        if (dateFin) {
          where.datePaiement.lte = new Date(dateFin);
        }
      }

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [paiements, total] = await Promise.all([
        prisma.paiement.findMany({
          where,
          include: {
            stagiaire: true,
          },
          orderBy: {
            datePaiement: 'desc',
          },
          take,
          skip,
        }),
        prisma.paiement.count({ where }),
      ]);

      res.status(200).json({ data: paiements, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET paiements:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { stagiaireId, montant, datePaiement, modePaiement, ...otherData } =
        req.body;

      const check = validateRequired(['stagiaireId', 'montant'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const montantCheck = validatePositiveNumber(montant, 'montant');
      if (!montantCheck.valid) {
        return res.status(400).json({ error: montantCheck.error });
      }

      if (modePaiement) {
        const enumCheck = validateEnum(
          modePaiement,
          ['especes', 'cheque', 'virement', 'carte'],
          'modePaiement'
        );
        if (!enumCheck.valid) {
          return res.status(400).json({ error: enumCheck.error });
        }
      }

      const paiement = await prisma.paiement.create({
        data: {
          ...otherData,
          stagiaireId: parseInt(stagiaireId),
          montant: parseFloat(montant),
          datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
          modePaiement: modePaiement || 'especes',
        },
        include: {
          stagiaire: true,
        },
      });

      res.status(201).json(paiement);
    } catch (error) {
      console.error('Erreur POST paiement:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
