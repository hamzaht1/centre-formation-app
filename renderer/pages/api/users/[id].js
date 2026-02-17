import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { requireRole } from '../../../lib/auth';
import { validateId, validateEnum, handlePrismaError } from '../../../lib/validation';

export default async function handler(req, res) {
  const auth = requireRole(req, res, 'admin');
  if (!auth) return;

  const { valid, id, error } = validateId(req.query.id);
  if (!valid) {
    return res.status(400).json({ error });
  }

  try {
    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          statut: true,
          formateurId: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      const { nom, prenom, email, password, role, statut, formateurId } = req.body;

      const updateData = {};
      if (nom !== undefined) updateData.nom = nom;
      if (prenom !== undefined) updateData.prenom = prenom;
      if (email !== undefined) updateData.email = email.toLowerCase().trim();
      if (formateurId !== undefined) updateData.formateurId = formateurId ? parseInt(formateurId) : null;

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (role) {
        const roleValidation = validateEnum(role, ['admin', 'formateur', 'secretaire'], 'Rôle');
        if (!roleValidation.valid) {
          return res.status(400).json({ error: roleValidation.error });
        }
        updateData.role = role;
      }

      if (statut) {
        const statutValidation = validateEnum(statut, ['actif', 'inactif'], 'Statut');
        if (!statutValidation.valid) {
          return res.status(400).json({ error: statutValidation.error });
        }
        updateData.statut = statut;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          statut: true,
          formateurId: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(user);
    }

    if (req.method === 'DELETE') {
      // Prevent admin from deleting themselves
      if (id === auth.userId) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: 'Utilisateur supprimé' });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    if (handlePrismaError(error, res)) return;
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
