import prisma from '../../../lib/prisma';
import { sendOtpEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'Si cet email existe, un code a été envoyé' });
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Invalidate previous unused codes for this user
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create new OTP (expires in 10 minutes)
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send email
    await sendOtpEmail(user.email, code, `${user.prenom} ${user.nom}`);

    return res.status(200).json({ message: 'Si cet email existe, un code a été envoyé' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
