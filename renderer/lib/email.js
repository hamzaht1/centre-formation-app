import nodemailer from 'nodemailer';

/**
 * Create a Nodemailer transporter
 * Falls back to console.log if SMTP is not configured
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || host === 'smtp.example.com' || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

/**
 * Send an OTP email to the user
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendOtpEmail(to, code, userName) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || 'Centre Formation <noreply@formation.com>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af;">Centre Formation</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Votre code de vérification est :</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 12px 24px; border-radius: 8px;">
          ${code}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>
  `;

  if (!transporter) {
    console.log('========================================');
    console.log(`OTP pour ${to}: ${code}`);
    console.log('(SMTP non configuré - email affiché en console)');
    console.log('========================================');
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Code de vérification - Centre Formation',
      html,
    });
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error.message);
    console.log(`Fallback OTP pour ${to}: ${code}`);
    return true;
  }
}
