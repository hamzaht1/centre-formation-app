import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { formationId } = req.query;

      const where = {};

      if (formationId) {
        where.formationId = parseInt(formationId);
      }

      const modules = await prisma.module.findMany({
        where,
        include: {
          formation: true,
        },
        orderBy: [
          {
            formationId: 'asc',
          },
          {
            ordre: 'asc',
          },
        ],
      });

      res.status(200).json(modules);
    } catch (error) {
      console.error('Erreur GET modules:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { formationId, dureeHeures, ordre, ...otherData } = req.body;

      const module = await prisma.module.create({
        data: {
          ...otherData,
          formationId: parseInt(formationId),
          dureeHeures: parseInt(dureeHeures),
          ordre: ordre ? parseInt(ordre) : 1,
        },
        include: {
          formation: true,
        },
      });

      res.status(201).json(module);
    } catch (error) {
      console.error('Erreur POST module:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}