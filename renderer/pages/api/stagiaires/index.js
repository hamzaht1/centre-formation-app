import prisma from '../../../lib/prisma';
import { validateRequired } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { search, statut, page, limit } = req.query;

      const where = {};

      if (search) {
        where.OR = [
          { nom: { contains: search } },
          { prenom: { contains: search } },
          { email: { contains: search } },
          { telephone: { contains: search } },
        ];
      }

      if (statut) {
        where.statut = statut;
      }

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [stagiaires, total] = await Promise.all([
        prisma.stagiaire.findMany({
          where,
          include: {
            inscriptions: {
              include: {
                session: {
                  include: {
                    formation: true,
                  },
                },
              },
            },
            _count: {
              select: {
                inscriptions: true,
                presences: true,
              },
            },
          },
          orderBy: {
            nom: 'asc',
          },
          take,
          skip,
        }),
        prisma.stagiaire.count({ where }),
      ]);

      res.status(200).json({ data: stagiaires, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET stagiaires:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { dateNaissance, ...otherData } = req.body;

      const check = validateRequired(['nom', 'prenom'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const stagiaire = await prisma.stagiaire.create({
        data: {
          ...otherData,
          dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        },
      });

      res.status(201).json(stagiaire);
    } catch (error) {
      console.error('Erreur POST stagiaire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
