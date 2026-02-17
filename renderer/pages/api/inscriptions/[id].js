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
      const inscription = await prisma.inscription.findUnique({
        where: { id: parsedId },
        include: {
          stagiaire: true,
          session: {
            include: {
              formation: true,
              formateur: true,
            },
          },
        },
      });

      if (!inscription) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      res.status(200).json(inscription);
    } catch (error) {
      console.error('Erreur GET inscription:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { montantTotal, montantPaye, noteFinale, modePaiement, ...otherData } = req.body;

      const current = await prisma.inscription.findUnique({ where: { id: parsedId } });
      if (!current) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      const newMontantPaye = montantPaye !== undefined ? parseFloat(montantPaye) : current.montantPaye;
      const diff = newMontantPaye - current.montantPaye;

      const updateData = {
        ...otherData,
        montantTotal: montantTotal !== undefined ? parseFloat(montantTotal) : undefined,
        montantPaye: montantPaye !== undefined ? parseFloat(montantPaye) : undefined,
        noteFinale: noteFinale !== undefined ? parseFloat(noteFinale) : undefined,
      };

      const includeRelations = {
        stagiaire: true,
        session: { include: { formation: true } },
      };

      let inscription;

      if (diff > 0) {
        const [updatedInscription] = await prisma.$transaction([
          prisma.inscription.update({
            where: { id: parsedId },
            data: updateData,
            include: includeRelations,
          }),
          prisma.paiement.create({
            data: {
              stagiaireId: current.stagiaireId,
              montant: diff,
              datePaiement: new Date(),
              modePaiement: modePaiement || 'especes',
              remarques: `Paiement inscription #${parsedId}`,
            },
          }),
        ]);
        inscription = updatedInscription;
      } else {
        inscription = await prisma.inscription.update({
          where: { id: parsedId },
          data: updateData,
          include: includeRelations,
        });
      }

      res.status(200).json(inscription);
    } catch (error) {
      console.error('Erreur PUT inscription:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.inscription.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Inscription supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE inscription:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
