import prisma from '../../../lib/prisma';
import { validateRequired, validatePositiveNumber } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { search, statut, niveau, categorie, typePublic, page, limit } = req.query;

      const where = {};

      if (search) {
        where.OR = [
          { nom: { contains: search } },
          { description: { contains: search } },
          { niveau: { contains: search } },
          { niveauDetail: { contains: search } },
        ];
      }

      if (statut) where.statut = statut;
      if (niveau) where.niveau = niveau;
      if (categorie) where.categorie = categorie;
      if (typePublic) where.typePublic = typePublic;

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [formations, total] = await Promise.all([
        prisma.formation.findMany({
          where,
          include: {
            _count: {
              select: { sessions: true },
            },
          },
          orderBy: [
            { categorie: 'asc' },
            { nom: 'asc' },
            { niveau: 'asc' },
          ],
          take,
          skip,
        }),
        prisma.formation.count({ where }),
      ]);

      res.status(200).json({ data: formations, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET formations:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { dureeHeures, prix, ...otherData } = req.body;

      const check = validateRequired(['nom'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const dureeCheck = validatePositiveNumber(dureeHeures, 'dureeHeures');
      if (!dureeCheck.valid) {
        return res.status(400).json({ error: dureeCheck.error });
      }

      const prixCheck = validatePositiveNumber(prix, 'prix', { allowZero: true });
      if (!prixCheck.valid) {
        return res.status(400).json({ error: prixCheck.error });
      }

      const formation = await prisma.formation.create({
        data: {
          ...otherData,
          dureeHeures: parseInt(dureeHeures),
          prix: parseFloat(prix),
        },
      });

      res.status(201).json(formation);
    } catch (error) {
      console.error('Erreur POST formation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
