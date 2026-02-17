import prisma from '../../../lib/prisma';
import { validateRequired, validateId, validateEnum } from '../../../lib/validation';
import { verifyAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  const auth = verifyAuth(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { stagiaireId, livreStagiaireIds, modePaiement, reference, remarques } = req.body;

    const check = validateRequired(['stagiaireId', 'livreStagiaireIds'], req.body);
    if (!check.valid) {
      return res.status(400).json({ error: `Champs requis manquants: ${check.missing.join(', ')}` });
    }

    const stagiaireIdCheck = validateId(stagiaireId);
    if (!stagiaireIdCheck.valid) {
      return res.status(400).json({ error: 'stagiaireId invalide' });
    }

    if (!Array.isArray(livreStagiaireIds) || livreStagiaireIds.length === 0) {
      return res.status(400).json({ error: 'livreStagiaireIds doit être un tableau non vide' });
    }

    if (livreStagiaireIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 attributions par paiement' });
    }

    if (modePaiement) {
      const enumCheck = validateEnum(
        modePaiement,
        ['especes', 'cheque', 'virement', 'carte'],
        'modePaiement'
      );
      if (!enumCheck.valid) {
        return res.status(400).json({ error: enumCheck.error });
      }
    }

    const parsedIds = livreStagiaireIds.map((id) => {
      const check = validateId(id);
      if (!check.valid) return null;
      return check.id;
    });

    if (parsedIds.includes(null)) {
      return res.status(400).json({ error: 'Un ou plusieurs IDs invalides dans livreStagiaireIds' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const attributions = await tx.livreStagiaire.findMany({
        where: {
          id: { in: parsedIds },
          stagiaireId: stagiaireIdCheck.id,
        },
      });

      if (attributions.length !== parsedIds.length) {
        throw { statusCode: 400, message: 'Certaines attributions sont introuvables ou n\'appartiennent pas à ce stagiaire' };
      }

      const dejaPayees = attributions.filter((a) => a.paiementId !== null);
      if (dejaPayees.length > 0) {
        throw { statusCode: 400, message: 'Certaines attributions sont déjà payées' };
      }

      const total = attributions.reduce((sum, a) => sum + a.prixUnitaire, 0);

      const paiement = await tx.paiement.create({
        data: {
          stagiaireId: stagiaireIdCheck.id,
          montant: total,
          modePaiement: modePaiement || 'especes',
          typePaiement: 'livre',
          reference: reference || null,
          remarques: remarques || null,
        },
      });

      await tx.livreStagiaire.updateMany({
        where: { id: { in: parsedIds } },
        data: { paiementId: paiement.id },
      });

      return await tx.paiement.findUnique({
        where: { id: paiement.id },
        include: {
          stagiaire: true,
          livresStagiaires: {
            include: {
              livre: true,
            },
          },
        },
      });
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Erreur POST livre-stagiaire/payer:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
