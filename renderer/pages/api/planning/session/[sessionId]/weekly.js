import prisma from '../../../../../lib/prisma';
import { verifyAuth } from '../../../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  const { sessionId } = req.query;

  if (req.method === 'POST') {
    try {
      const {
        startDate,
        daysOfWeek = [1, 2, 3, 4, 5],
        heureDebut = '09:00',
        heureFin = '12:00',
        formateurId,
        salleId = null,
        statut = 'planifie',
        remarques = '',
      } = req.body;

      if (!startDate || !formateurId) {
        return res.status(400).json({ error: 'startDate et formateurId sont obligatoires' });
      }

      // 1. Récupérer la session
      const session = await prisma.session.findUnique({
        where: { id: parseInt(sessionId) },
        include: { formation: true, salle: true },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      // Utiliser la salle de la session si non spécifiée
      const selectedSalleId = salleId || session.salleId;

      const generatedPlannings = [];
      const conflicts = [];
      const start = new Date(startDate);

      // 2. Boucle sur 7 jours (une semaine)
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        currentDate.setHours(0, 0, 0, 0);

        // Vérifier si ce jour fait partie des jours demandés
        if (!daysOfWeek.includes(currentDate.getDay())) {
          continue;
        }

        const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDate.getDay()];
        const dateStr = currentDate.toLocaleDateString('fr-FR');

        // ============ VÉRIFICATION DISPONIBILITÉ FORMATEUR ============
        const formateurDisponible = await prisma.disponibilite.findFirst({
          where: {
            formateurId: parseInt(formateurId),
            jourSemaine: currentDate.getDay(),
            actif: true,
            heureDebut: { lte: heureDebut },
            heureFin: { gte: heureFin },
          },
        });

        if (!formateurDisponible) {
          conflicts.push({
            date: dateStr,
            day: dayName,
            type: 'formateur_indisponible',
            message: `Le formateur n'est pas disponible le ${dayName} de ${heureDebut} à ${heureFin}`,
          });
          continue;
        }

        // ============ VÉRIFICATION CONFLIT PLANNING FORMATEUR ============
        const conflitFormateur = await prisma.planning.findFirst({
          where: {
            formateurId: parseInt(formateurId),
            date: currentDate,
            statut: { not: 'annule' },
            OR: [
              { AND: [{ heureDebut: { lte: heureDebut } }, { heureFin: { gt: heureDebut } }] },
              { AND: [{ heureDebut: { lt: heureFin } }, { heureFin: { gte: heureFin } }] },
              { AND: [{ heureDebut: { gte: heureDebut } }, { heureFin: { lte: heureFin } }] },
            ],
          },
          include: {
            session: { include: { formation: true } },
          },
        });

        if (conflitFormateur) {
          conflicts.push({
            date: dateStr,
            day: dayName,
            type: 'formateur_occupe',
            message: `Le formateur a déjà un cours "${conflitFormateur.session.formation.nom}" de ${conflitFormateur.heureDebut} à ${conflitFormateur.heureFin}`,
          });
          continue;
        }

        // ============ VÉRIFICATION DISPONIBILITÉ SALLE ============
        if (selectedSalleId) {
          const salle = await prisma.salle.findUnique({
            where: { id: parseInt(selectedSalleId) },
          });

          if (!salle) {
            conflicts.push({
              date: dateStr,
              day: dayName,
              type: 'salle_inexistante',
              message: 'La salle spécifiée n\'existe pas',
            });
            continue;
          }

          if (salle.statut !== 'disponible') {
            conflicts.push({
              date: dateStr,
              day: dayName,
              type: 'salle_indisponible',
              message: `La salle "${salle.nom}" est ${salle.statut}`,
            });
            continue;
          }

          // ============ VÉRIFICATION CONFLIT PLANNING SALLE ============
          const conflitSalle = await prisma.planning.findFirst({
            where: {
              salleId: parseInt(selectedSalleId),
              date: currentDate,
              statut: { not: 'annule' },
              OR: [
                { AND: [{ heureDebut: { lte: heureDebut } }, { heureFin: { gt: heureDebut } }] },
                { AND: [{ heureDebut: { lt: heureFin } }, { heureFin: { gte: heureFin } }] },
                { AND: [{ heureDebut: { gte: heureDebut } }, { heureFin: { lte: heureFin } }] },
              ],
            },
            include: {
              session: { include: { formation: true } },
            },
          });

          if (conflitSalle) {
            conflicts.push({
              date: dateStr,
              day: dayName,
              type: 'salle_occupee',
              message: `La salle "${salle.nom}" est déjà réservée pour "${conflitSalle.session.formation.nom}" de ${conflitSalle.heureDebut} à ${conflitSalle.heureFin}`,
            });
            continue;
          }
        }

        // ============ CRÉATION DU PLANNING (si aucun conflit) ============
        const newPlanning = await prisma.planning.create({
          data: {
            sessionId: parseInt(sessionId),
            formateurId: parseInt(formateurId),
            date: currentDate,
            heureDebut,
            heureFin,
            salleId: selectedSalleId ? parseInt(selectedSalleId) : null,
            statut,
            remarques,
          },
          include: {
            session: { include: { formation: true } },
            formateur: true,
            salle: true,
          },
        });

        generatedPlannings.push(newPlanning);
      }

      // Réponse avec détails
      res.status(201).json({
        message: `Planning généré : ${generatedPlannings.length} séances créées, ${conflicts.length} conflits détectés`,
        plannings: generatedPlannings,
        conflicts: conflicts,
        summary: {
          created: generatedPlannings.length,
          conflicts: conflicts.length,
          total: generatedPlannings.length + conflicts.length,
        },
      });

    } catch (error) {
      console.error('Erreur POST planning weekly:', error);
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}