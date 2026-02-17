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
      const stagiaire = await prisma.stagiaire.findUnique({
        where: { id: parsedId },
        include: {
          inscriptions: {
            include: {
              session: {
                include: {
                  formation: true,
                  formateur: true,
                },
              },
            },
          },
          presences: {
            include: {
              session: true,
            },
            orderBy: {
              date: 'desc',
            },
            take: 50,
          },
          paiements: {
            orderBy: {
              datePaiement: 'desc',
            },
          },
          livresStagiaires: {
            include: {
              livre: { include: { formation: true } },
              paiement: true,
            },
            orderBy: { dateAttribution: 'desc' },
          },
        },
      });

      if (!stagiaire) {
        return res.status(404).json({ error: 'Stagiaire non trouvé' });
      }

      const totalPresences = stagiaire.presences.length;
      const presencesPresent = stagiaire.presences.filter(
        (p) => p.statut === 'present'
      ).length;

      const totalPaye = stagiaire.paiements.reduce(
        (sum, p) => sum + p.montant,
        0
      );

      const livresAttribues = stagiaire.livresStagiaires.length;
      const livresPayes = stagiaire.livresStagiaires.filter((ls) => ls.paiementId !== null).length;
      const livresNonPayes = livresAttribues - livresPayes;

      const stats = {
        totalPresences,
        presencesPresent,
        tauxPresence:
          totalPresences > 0
            ? Math.round((presencesPresent / totalPresences) * 100)
            : 0,
        totalPaye,
        nombreInscriptions: stagiaire.inscriptions.length,
        livresAttribues,
        livresPayes,
        livresNonPayes,
      };

      res.status(200).json({ ...stagiaire, stats });
    } catch (error) {
      console.error('Erreur GET stagiaire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { dateNaissance, ...otherData } = req.body;

      const stagiaire = await prisma.stagiaire.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        },
      });

      res.status(200).json(stagiaire);
    } catch (error) {
      console.error('Erreur PUT stagiaire:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.livreStagiaire.deleteMany({
        where: { stagiaireId: parsedId },
      });

      await prisma.presence.deleteMany({
        where: { stagiaireId: parsedId },
      });

      await prisma.paiement.deleteMany({
        where: { stagiaireId: parsedId },
      });

      await prisma.inscription.deleteMany({
        where: { stagiaireId: parsedId },
      });

      await prisma.stagiaire.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Stagiaire supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE stagiaire:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
