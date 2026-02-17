import prisma from '../../../lib/prisma';
import { validateRequired, validatePositiveNumber } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { search, type, statut, capaciteMin } = req.query;

      const where = {};

      if (search) {
        where.OR = [
          { nom: { contains: search } },
          { batiment: { contains: search } },
          { equipements: { contains: search } },
        ];
      }

      if (type) where.type = type;
      if (statut) where.statut = statut;

      if (capaciteMin) {
        where.capacite = {
          gte: parseInt(capaciteMin),
        };
      }

      const salles = await prisma.salle.findMany({
        where,
        include: {
          _count: {
            select: {
              sessions: true,
              planning: true,
            },
          },
        },
        orderBy: {
          nom: 'asc',
        },
      });

      res.status(200).json(salles);
    } catch (error) {
      console.error('Erreur GET salles:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { capacite, ...otherData } = req.body;

      const check = validateRequired(['nom', 'capacite'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const capCheck = validatePositiveNumber(capacite, 'capacite');
      if (!capCheck.valid) {
        return res.status(400).json({ error: capCheck.error });
      }

      const salle = await prisma.salle.create({
        data: {
          ...otherData,
          capacite: parseInt(capacite),
        },
      });

      res.status(201).json(salle);
    } catch (error) {
      console.error('Erreur POST salle:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Une salle avec ce nom existe déjà',
        });
      }

      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
