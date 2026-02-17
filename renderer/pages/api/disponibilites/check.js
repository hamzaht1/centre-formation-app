import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

/**
 * API de vérification en temps réel des disponibilités
 * Complète les APIs existantes /api/disponibilites et /api/disponibilites/[id]
 *
 * Usage: GET /api/disponibilites/check?formateurId=5&salleId=3&date=2026-02-10&heureDebut=09:00&heureFin=12:00
 */
export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { formateurId, salleId, date, heureDebut, heureFin } = req.query;

    const result = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // ============ VÉRIFICATION FORMATEUR ============
    if (formateurId) {
      const formateur = await prisma.formateur.findUnique({
        where: { id: parseInt(formateurId) },
        include: {
          disponibilites: {
            where: { actif: true },
            orderBy: { jourSemaine: 'asc' },
          },
        },
      });

      if (!formateur) {
        return res.status(404).json({ error: 'Formateur non trouvé' });
      }

      result.checks.formateur = {
        id: formateur.id,
        nom: `${formateur.prenom} ${formateur.nom}`,
        statut: formateur.statut,
        disponibilites: formateur.disponibilites.map(d => ({
          id: d.id,
          jour: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.jourSemaine],
          jourSemaine: d.jourSemaine,
          horaire: `${d.heureDebut} - ${d.heureFin}`,
          heureDebut: d.heureDebut,
          heureFin: d.heureFin,
          typeRecurrence: d.typeRecurrence,
        })),
      };

      // Si une date est fournie, vérifier les conflits
      if (date) {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const conflicts = await prisma.planning.findMany({
          where: {
            formateurId: parseInt(formateurId),
            date: checkDate,
            statut: { not: 'annule' },
          },
          include: {
            session: { 
              include: { 
                formation: true,
                salle: true,
              } 
            },
            salle: true,
          },
          orderBy: { heureDebut: 'asc' },
        });

        result.checks.formateur.conflitsJour = conflicts.map(c => ({
          id: c.id,
          horaire: `${c.heureDebut} - ${c.heureFin}`,
          formation: c.session.formation.nom,
          session: c.session.nom,
          salle: c.salle?.nom || c.session.salle?.nom || 'Non spécifiée',
        }));
      }
    }

    // ============ VÉRIFICATION SALLE ============
    if (salleId) {
      const salle = await prisma.salle.findUnique({
        where: { id: parseInt(salleId) },
      });

      if (!salle) {
        return res.status(404).json({ error: 'Salle non trouvée' });
      }

      result.checks.salle = {
        id: salle.id,
        nom: salle.nom,
        capacite: salle.capacite,
        statut: salle.statut,
        disponible: salle.statut === 'disponible',
        equipements: salle.equipements,
        type: salle.type,
      };

      // Si une date est fournie, vérifier les conflits
      if (date) {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const conflicts = await prisma.planning.findMany({
          where: {
            salleId: parseInt(salleId),
            date: checkDate,
            statut: { not: 'annule' },
          },
          include: {
            session: { 
              include: { 
                formation: true 
              } 
            },
            formateur: true,
          },
          orderBy: { heureDebut: 'asc' },
        });

        result.checks.salle.conflitsJour = conflicts.map(c => ({
          id: c.id,
          horaire: `${c.heureDebut} - ${c.heureFin}`,
          formation: c.session.formation.nom,
          session: c.session.nom,
          formateur: `${c.formateur.prenom} ${c.formateur.nom}`,
        }));
      }
    }

    // ============ VÉRIFICATION CRÉNEAU PRÉCIS ============
    if (date && heureDebut && heureFin) {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const dayOfWeek = checkDate.getDay();

      result.verification = {
        date: checkDate.toLocaleDateString('fr-FR'),
        jour: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek],
        jourSemaine: dayOfWeek,
        horaire: `${heureDebut} - ${heureFin}`,
        heureDebut,
        heureFin,
        disponible: true,
        problemes: [],
        avertissements: [],
      };

      // Vérifier formateur
      if (formateurId) {
        // 1. Vérifier disponibilité hebdomadaire
        const formateurDispo = await prisma.disponibilite.findFirst({
          where: {
            formateurId: parseInt(formateurId),
            jourSemaine: dayOfWeek,
            actif: true,
            heureDebut: { lte: heureDebut },
            heureFin: { gte: heureFin },
          },
        });

        if (!formateurDispo) {
          result.verification.disponible = false;
          result.verification.problemes.push({
            type: 'formateur_indisponible',
            gravite: 'bloquant',
            message: `Le formateur n'est pas disponible le ${result.verification.jour} de ${heureDebut} à ${heureFin}`,
          });
        }

        // 2. Vérifier conflits planning
        const formateurOccupe = await prisma.planning.findFirst({
          where: {
            formateurId: parseInt(formateurId),
            date: checkDate,
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

        if (formateurOccupe) {
          result.verification.disponible = false;
          result.verification.problemes.push({
            type: 'formateur_occupe',
            gravite: 'bloquant',
            message: `Le formateur a déjà un cours "${formateurOccupe.session.formation.nom}" de ${formateurOccupe.heureDebut} à ${formateurOccupe.heureFin}`,
            details: {
              sessionId: formateurOccupe.sessionId,
              formation: formateurOccupe.session.formation.nom,
              horaire: `${formateurOccupe.heureDebut} - ${formateurOccupe.heureFin}`,
            },
          });
        }

        // 3. Vérifier statut formateur
        const formateurInfo = await prisma.formateur.findUnique({
          where: { id: parseInt(formateurId) },
        });

        if (formateurInfo?.statut !== 'actif') {
          result.verification.avertissements.push({
            type: 'formateur_inactif',
            gravite: 'avertissement',
            message: `Le formateur a le statut "${formateurInfo?.statut}"`,
          });
        }
      }

      // Vérifier salle
      if (salleId) {
        const salle = await prisma.salle.findUnique({
          where: { id: parseInt(salleId) },
        });

        if (!salle) {
          result.verification.disponible = false;
          result.verification.problemes.push({
            type: 'salle_inexistante',
            gravite: 'bloquant',
            message: 'La salle spécifiée n\'existe pas',
          });
        } else {
          // 1. Vérifier statut
          if (salle.statut !== 'disponible') {
            result.verification.disponible = false;
            result.verification.problemes.push({
              type: 'salle_indisponible',
              gravite: 'bloquant',
              message: `La salle "${salle.nom}" est actuellement "${salle.statut}"`,
            });
          }

          // 2. Vérifier conflits planning
          const salleOccupee = await prisma.planning.findFirst({
            where: {
              salleId: parseInt(salleId),
              date: checkDate,
              statut: { not: 'annule' },
              OR: [
                { AND: [{ heureDebut: { lte: heureDebut } }, { heureFin: { gt: heureDebut } }] },
                { AND: [{ heureDebut: { lt: heureFin } }, { heureFin: { gte: heureFin } }] },
                { AND: [{ heureDebut: { gte: heureDebut } }, { heureFin: { lte: heureFin } }] },
              ],
            },
            include: {
              session: { include: { formation: true } },
              formateur: true,
            },
          });

          if (salleOccupee) {
            result.verification.disponible = false;
            result.verification.problemes.push({
              type: 'salle_occupee',
              gravite: 'bloquant',
              message: `La salle "${salle.nom}" est déjà réservée pour "${salleOccupee.session.formation.nom}" de ${salleOccupee.heureDebut} à ${salleOccupee.heureFin}`,
              details: {
                sessionId: salleOccupee.sessionId,
                formation: salleOccupee.session.formation.nom,
                formateur: `${salleOccupee.formateur.prenom} ${salleOccupee.formateur.nom}`,
                horaire: `${salleOccupee.heureDebut} - ${salleOccupee.heureFin}`,
              },
            });
          }
        }
      }

      // Résumé de la vérification
      result.verification.resume = {
        disponible: result.verification.disponible,
        nbProblemes: result.verification.problemes.length,
        nbAvertissements: result.verification.avertissements.length,
        message: result.verification.disponible 
          ? '✅ Créneau disponible' 
          : `❌ ${result.verification.problemes.length} problème(s) détecté(s)`,
      };
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur vérification disponibilités:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}