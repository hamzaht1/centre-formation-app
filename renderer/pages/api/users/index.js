import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { requireRole } from '../../../lib/auth';
import { validateRequired, validateEnum } from '../../../lib/validation';

export default async function handler(req, res) {
  const auth = requireRole(req, res, 'admin');
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const where = {};
      if (req.query.role) where.role = req.query.role;
      if (req.query.statut) where.statut = req.query.statut;

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({ data, total, page, limit });
    }

    if (req.method === 'POST') {
      const { nom, prenom, email, password, role, formateurId } = req.body;

      const validation = validateRequired(['nom', 'prenom', 'email', 'password'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: `Champs requis: ${validation.missing.join(', ')}` });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      if (role) {
        const roleValidation = validateEnum(role, ['admin', 'formateur', 'secretaire'], 'Rôle');
        if (!roleValidation.valid) {
          return res.status(400).json({ error: roleValidation.error });
        }
      }

      // Check email uniqueness
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existing) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          nom,
          prenom,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: role || 'secretaire',
          formateurId: formateurId ? parseInt(formateurId) : null,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          statut: true,
          createdAt: true,
        },
      });

      return res.status(201).json(user);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Users API error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
