import prisma from '../../../lib/prisma';
import { validateRequired } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { stagiaireId, sessionId, statut, page, limit } = req.query;

      const where = {};

      if (stagiaireId) {
        where.stagiaireId = parseInt(stagiaireId);
      }

      if (sessionId) {
        where.sessionId = parseInt(sessionId);
      }

      if (statut) {
        where.statut = statut;
      }

      const take = Math.min(parseInt(limit) || 50, 200);
      const skip = ((parseInt(page) || 1) - 1) * take;

      const [inscriptions, total] = await Promise.all([
        prisma.inscription.findMany({
          where,
          include: {
            stagiaire: true,
            session: {
              include: {
                formation: true,
              },
            },
          },
          orderBy: {
            dateInscription: 'desc',
          },
          take,
          skip,
        }),
        prisma.inscription.count({ where }),
      ]);

      res.status(200).json({ data: inscriptions, total, page: parseInt(page) || 1, limit: take });
    } catch (error) {
      console.error('Erreur GET inscriptions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        stagiaireId,
        sessionId,
        montantTotal,
        montantPaye,
        assignerLivres,
        selectedLivreIds,
        ...otherData
      } = req.body;

      const check = validateRequired(['stagiaireId', 'sessionId', 'montantTotal'], req.body);
      if (!check.valid) {
        return res.status(400).json({
          error: `Champs requis manquants: ${check.missing.join(', ')}`,
        });
      }

      // Use transaction to prevent race conditions
      const inscription = await prisma.$transaction(async (tx) => {
        // Check session capacity
        const session = await tx.session.findUnique({
          where: { id: parseInt(sessionId) },
          include: {
            _count: {
              select: { inscriptions: true },
            },
          },
        });

        if (!session) {
          throw { statusCode: 404, message: 'Session non trouvée' };
        }

        if (session._count.inscriptions >= session.capaciteMax) {
          throw { statusCode: 400, message: 'Session complète' };
        }

        // Check for duplicate enrollment
        const existingInscription = await tx.inscription.findFirst({
          where: {
            stagiaireId: parseInt(stagiaireId),
            sessionId: parseInt(sessionId),
          },
        });

        if (existingInscription) {
          throw { statusCode: 400, message: 'Stagiaire déjà inscrit à cette session' };
        }

        const inscription = await tx.inscription.create({
          data: {
            ...otherData,
            stagiaireId: parseInt(stagiaireId),
            sessionId: parseInt(sessionId),
            montantTotal: parseFloat(montantTotal),
            montantPaye: montantPaye ? parseFloat(montantPaye) : 0,
          },
          include: {
            stagiaire: true,
            session: {
              include: {
                formation: true,
              },
            },
          },
        });

        // Auto-assign selected livres
        if (assignerLivres && selectedLivreIds && selectedLivreIds.length > 0) {
          const livres = await tx.livre.findMany({
            where: {
              id: { in: selectedLivreIds.map((id) => parseInt(id)) },
              quantite: { gt: 0 },
            },
          });

          for (const livre of livres) {
            await tx.livreStagiaire.create({
              data: {
                livreId: livre.id,
                stagiaireId: parseInt(stagiaireId),
                inscriptionId: inscription.id,
                prixUnitaire: livre.prix,
              },
            });

            await tx.livre.update({
              where: { id: livre.id },
              data: { quantite: { decrement: 1 } },
            });
          }
        }

        return inscription;
      });

      res.status(201).json(inscription);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erreur POST inscription:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
