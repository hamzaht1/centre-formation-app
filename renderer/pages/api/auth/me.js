import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const auth = verifyAuth(req, res);
  if (!auth) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        statut: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
