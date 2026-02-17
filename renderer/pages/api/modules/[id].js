import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const module = await prisma.module.findUnique({
        where: { id: parseInt(id) },
        include: {
          formation: true,
          planning: {
            include: {
              session: true,
              formateur: true,
            },
          },
        },
      });

      if (!module) {
        return res.status(404).json({ error: 'Module non trouvé' });
      }

      res.status(200).json(module);
    } catch (error) {
      console.error('Erreur GET module:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { formationId, dureeHeures, ordre, ...otherData } = req.body;

      const module = await prisma.module.update({
        where: { id: parseInt(id) },
        data: {
          ...otherData,
          formationId: formationId ? parseInt(formationId) : undefined,
          dureeHeures: dureeHeures ? parseInt(dureeHeures) : undefined,
          ordre: ordre ? parseInt(ordre) : undefined,
        },
        include: {
          formation: true,
        },
      });

      res.status(200).json(module);
    } catch (error) {
      console.error('Erreur PUT module:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Supprimer le planning lié
      await prisma.planning.deleteMany({
        where: { moduleId: parseInt(id) },
      });

      // Mettre à null les présences liées
      await prisma.presence.updateMany({
        where: { moduleId: parseInt(id) },
        data: { moduleId: null },
      });

      // Supprimer le module
      await prisma.module.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ message: 'Module supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE module:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}