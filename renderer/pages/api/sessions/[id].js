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
      const session = await prisma.session.findUnique({
        where: { id: parsedId },
        include: {
          formation: {},
          formateur: true,
          salle: true,
          inscriptions: {
            include: {
              stagiaire: true,
            },
            orderBy: {
              dateInscription: 'asc',
            },
          },
          planning: {
            include: {
              formateur: true,
            },
            orderBy: {
              date: 'asc',
            },
          },
          _count: {
            select: {
              inscriptions: true,
              planning: true,
              presences: true,
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const placesRestantes = session.capaciteMax - session._count.inscriptions;
      const tauxRemplissage = Math.round(
        (session._count.inscriptions / session.capaciteMax) * 100
      );

      const stats = {
        placesRestantes,
        tauxRemplissage,
        nombreInscrits: session._count.inscriptions,
        nombreSeances: session._count.planning,
      };

      res.status(200).json({ ...session, stats });
    } catch (error) {
      console.error('Erreur GET session:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        dateDebut,
        dateFin,
        formationId,
        formateurPrincipalId,
        capaciteMax,
        ...otherData
      } = req.body;

      const session = await prisma.session.update({
        where: { id: parsedId },
        data: {
          ...otherData,
          dateDebut: dateDebut ? new Date(dateDebut) : undefined,
          dateFin: dateFin ? new Date(dateFin) : undefined,
          formationId: formationId ? parseInt(formationId) : undefined,
          formateurPrincipalId: formateurPrincipalId !== undefined
            ? (formateurPrincipalId ? parseInt(formateurPrincipalId) : null)
            : undefined,
          capaciteMax: capaciteMax !== undefined ? parseInt(capaciteMax) : undefined,
        },
        include: {
          formation: true,
          formateur: true,
        },
      });

      res.status(200).json(session);
    } catch (error) {
      console.error('Erreur PUT session:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const inscriptionsCount = await prisma.inscription.count({
        where: { sessionId: parsedId },
      });

      if (inscriptionsCount > 0) {
        return res.status(400).json({
          error: 'Impossible de supprimer une session avec des inscriptions',
        });
      }

      await prisma.planning.deleteMany({
        where: { sessionId: parsedId },
      });

      await prisma.presence.deleteMany({
        where: { sessionId: parsedId },
      });

      await prisma.session.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: 'Session supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE session:', error);
      if (handlePrismaError(error, res)) return;
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
