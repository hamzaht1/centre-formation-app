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
      const disponibilite = await prisma.disponibilite.findUnique({
        where: { id: parsedId },
        include: {
          formateur: true,
        },
      });

      if (!disponibilite) {
        return res.status(404).json({ error: 'Disponibilité non trouvée' });
      }

      res.status(200).json(disponibilite);
    } catch (error) {
      console.error('Erreur GET disponibilité:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { dateDebut, dateFin, ...otherData } = req.body;

      const disponibilite = await prisma.disponibilite.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          dateDebut: dateDebut ? new Date(dateDebut) : null,
          dateFin: dateFin ? new Date(dateFin) : null,
        },
      });

      res.status(200).json(disponibilite);
    } catch (error) {
      console.error('Erreur PUT disponibilité:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.disponibilite.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Disponibilité supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE disponibilité:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
