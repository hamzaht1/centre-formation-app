import prisma from '../../../lib/prisma';
import { validateRequired } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { search, statut } = req.query;

      const where = {};

      if (search) {
        where.OR = [
          { nom: { contains: search } },
          { prenom: { contains: search } },
          { email: { contains: search } },
          { specialites: { contains: search } },
        ];
      }

      if (statut) {
        where.statut = statut;
      }

      const formateurs = await prisma.formateur.findMany({
        where,
        include: {
          _count: {
            select: {
              sessions: true,
              planning: true,
              disponibilites: true,
            },
          },
          disponibilites: {
            where: { actif: true },
            orderBy: [
              { jourSemaine: 'asc' },
              { heureDebut: 'asc' },
            ],
          },
        },
        orderBy: {
          nom: 'asc',
        },
      });

      res.status(200).json(formateurs);
    } catch (error) {
      console.error('Erreur GET formateurs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const { dateEmbauche, disponibilites, ...otherData } = req.body;

      const check = validateRequired(['nom', 'prenom'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      const formateur = await prisma.formateur.create({
        data: {
          ...otherData,
          dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : new Date(),
          disponibilites: disponibilites ? {
            create: disponibilites.map(dispo => ({
              jourSemaine: dispo.jourSemaine,
              heureDebut: dispo.heureDebut,
              heureFin: dispo.heureFin,
              typeRecurrence: dispo.typeRecurrence || 'hebdomadaire',
              dateDebut: dispo.dateDebut ? new Date(dispo.dateDebut) : null,
              dateFin: dispo.dateFin ? new Date(dispo.dateFin) : null,
              actif: dispo.actif !== undefined ? dispo.actif : true,
              remarques: dispo.remarques || null,
            }))
          } : undefined,
        },
        include: {
          disponibilites: true,
        },
      });

      res.status(201).json(formateur);
    } catch (error) {
      console.error('Erreur POST formateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
