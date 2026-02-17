import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code requis' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    // Find valid, unused OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Generate a short-lived reset token (5 minutes)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.status(200).json({ resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
