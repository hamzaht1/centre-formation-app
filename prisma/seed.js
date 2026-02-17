// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding (version SANS MODULE et robuste)...');

  try {
    // Nettoyage complet de la base (recommandé pour tests répétés)
    console.log('Nettoyage préalable de la base...');
    await prisma.otpCode.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.presence.deleteMany({});
    await prisma.planning.deleteMany({});
    await prisma.livreStagiaire.deleteMany({});
    await prisma.paiement.deleteMany({});
    await prisma.inscription.deleteMany({});
    await prisma.livre.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.disponibilite.deleteMany({});
    await prisma.formation.deleteMany({});
    await prisma.stagiaire.deleteMany({});
    await prisma.formateur.deleteMany({});
    console.log('Base nettoyée avec succès');

    // 1. Formateurs (anti-doublon sur email)
    console.log('Création des formateurs...');
    const formateurData = [
      {
        nom: 'Ben Ali',
        prenom: 'Mohamed',
        email: 'mohamed.benali@presma.tn',
        telephone: '+21698123456',
        specialites: 'React, Next.js, TypeScript, Tailwind',
        experience: '8 ans',
        statut: 'actif',
      },
      {
        nom: 'Trabelsi',
        prenom: 'Sarra',
        email: 'sarra.trabelsi@presma.tn',
        telephone: '+21697654321',
        specialites: 'UI/UX Design, Figma, Adobe XD',
        experience: '6 ans',
        statut: 'actif',
      },
      {
        nom: 'Jlassi',
        prenom: 'Amine',
        email: 'amine.jlassi@presma.tn',
        telephone: '+21655789012',
        specialites: 'Node.js, Express, PostgreSQL',
        experience: '7 ans',
        statut: 'actif',
      },
      {
        nom: 'Haddad',
        prenom: 'Nour',
        email: 'nour.haddad@presma.tn',
        specialites: 'Python, Django, Data Science',
        experience: '4 ans',
        statut: 'actif',
      },
    ];

    const formateurs = [];
    for (const data of formateurData) {
      const existing = await prisma.formateur.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        console.log(`Formateur ${data.email} existe déjà → skip`);
        formateurs.push(existing);
      } else {
        const created = await prisma.formateur.create({ data });
        formateurs.push(created);
        console.log(`→ Formateur créé : ${data.email}`);
      }
    }

    // 2. Stagiaires (anti-doublon sur email)
    console.log('Création des stagiaires...');
    const stagiaireData = [
      {
        nom: 'Guesmi',
        prenom: 'Yassine',
        email: 'yassine.guesmi@gmail.com',
        telephone: '+21699111222',
        statut: 'actif',
      },
      {
        nom: 'Mabrouk',
        prenom: 'Aya',
        email: 'aya.mabrouk@outlook.com',
        telephone: '+21698333444',
        statut: 'actif',
      },
      {
        nom: 'Khelifi',
        prenom: 'Omar',
        email: 'omar.khelifi@yahoo.fr',
        statut: 'actif',
      },
      {
        nom: 'Saidi',
        prenom: 'Nourhane',
        email: 'nourhane.saidi@gmail.com',
        statut: 'actif',
      },
      {
        nom: 'Cherif',
        prenom: 'Ahmed',
        email: 'ahmed.cherif@proton.me',
        statut: 'actif',
      },
      {
        nom: 'Bouslama',
        prenom: 'Fatma',
        email: 'fatma.bouslama@live.com',
        statut: 'actif',
      },
      {
        nom: 'Hammami',
        prenom: 'Karim',
        email: 'karim.hammami@gmail.com',
        statut: 'actif',
      },
      {
        nom: 'Jaziri',
        prenom: 'Leila',
        email: 'leila.jaziri@outlook.com',
        statut: 'actif',
      },
    ];

    const stagiaires = [];
    for (const data of stagiaireData) {
      const existing = await prisma.stagiaire.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        console.log(`Stagiaire ${data.email} existe déjà → skip`);
        stagiaires.push(existing);
      } else {
        const created = await prisma.stagiaire.create({ data });
        stagiaires.push(created);
        console.log(`→ Stagiaire créé : ${data.email}`);
      }
    }

    // 3. Formations (pas de doublon possible sur id)
    console.log('Création des formations...');
    const formations = await prisma.formation.createMany({
      data: [
        {
          nom: 'Développement Web Full Stack',
          description: 'Formation complète : HTML/CSS/JS → React/Next.js → Node.js/Express → PostgreSQL.',
          dureeHeures: 240,
          prix: 1800,
          niveau: 'intermediaire',
          statut: 'active',
        },
        {
          nom: 'UI/UX Design & Figma Masterclass',
          description: 'Conception d’interfaces modernes, wireframing, prototypage.',
          dureeHeures: 120,
          prix: 950,
          niveau: 'debutant',
          statut: 'active',
        },
        {
          nom: 'Python pour Data Science & Machine Learning',
          description: 'Analyse de données, visualisation, modélisation ML.',
          dureeHeures: 180,
          prix: 1450,
          niveau: 'intermediaire',
          statut: 'active',
        },
        {
          nom: 'Marketing Digital & Growth Hacking',
          description: 'SEO, SEA, Social Media Ads, Analytics.',
          dureeHeures: 100,
          prix: 850,
          niveau: 'debutant',
          statut: 'active',
        },
      ],
    });
    console.log(`→ ${formations.count} formations créées`);

    // Récupère les formations pour les utiliser dans les sessions
    const allFormations = await prisma.formation.findMany();

    // 4. Sessions
    console.log('Création des sessions...');
    const sessions = await Promise.all([
      prisma.session.create({
        data: {
          nom: 'Session Janvier 2026 - Full Stack',
          formationId: allFormations[0].id,
          formateurPrincipalId: formateurs[0].id,
          dateDebut: new Date('2026-01-10'),
          dateFin: new Date('2026-04-30'),
          horaires: 'Lundi, Mercredi, Vendredi 18h30-21h30',
          capaciteMax: 18,
          statut: 'en_cours',
        },
      }),
      prisma.session.create({
        data: {
          nom: 'Session Mars 2026 - Full Stack',
          formationId: allFormations[0].id,
          formateurPrincipalId: formateurs[2].id,
          dateDebut: new Date('2026-03-01'),
          dateFin: new Date('2026-06-20'),
          horaires: 'Mardi, Jeudi, Samedi 09h00-12h00',
          capaciteMax: 20,
          statut: 'a_venir',
        },
      }),
    ]);
    console.log(`→ ${sessions.length} sessions créées`);

    // 5. Inscriptions
    console.log('Création des inscriptions...');
    await prisma.inscription.createMany({
      data: [
        { stagiaireId: stagiaires[0].id, sessionId: sessions[0].id, montantTotal: 1800, montantPaye: 900, statut: 'en_cours' },
        { stagiaireId: stagiaires[1].id, sessionId: sessions[0].id, montantTotal: 1800, montantPaye: 1800, statut: 'terminee' },
        { stagiaireId: stagiaires[2].id, sessionId: sessions[0].id, montantTotal: 1800, montantPaye: 500, statut: 'en_cours' },
        { stagiaireId: stagiaires[3].id, sessionId: sessions[1].id, montantTotal: 1800, montantPaye: 0, statut: 'en_cours' },
        { stagiaireId: stagiaires[4].id, sessionId: sessions[1].id, montantTotal: 1800, montantPaye: 1200, statut: 'en_cours' },
      ],
    });
    console.log('→ Inscriptions créées');

    // 6. Paiements
    console.log('Création des paiements...');
    await prisma.paiement.createMany({
      data: [
        { stagiaireId: stagiaires[0].id, montant: 900, datePaiement: new Date('2026-01-08'), modePaiement: 'virement' },
        { stagiaireId: stagiaires[1].id, montant: 1800, datePaiement: new Date('2026-01-05'), modePaiement: 'carte' },
        { stagiaireId: stagiaires[2].id, montant: 500, datePaiement: new Date('2026-01-12'), modePaiement: 'especes' },
        { stagiaireId: stagiaires[4].id, montant: 1200, datePaiement: new Date('2026-02-20'), modePaiement: 'cheque' },
      ],
    });
    console.log('→ Paiements créés');

    // 7. Planning
    console.log('Création du planning...');
    await prisma.planning.createMany({
      data: [
        {
          sessionId: sessions[0].id,
          formateurId: formateurs[0].id,
          date: new Date('2026-01-12'),
          heureDebut: '18:30',
          heureFin: '21:30',
          statut: 'planifie',
        },
        {
          sessionId: sessions[0].id,
          formateurId: formateurs[0].id,
          date: new Date('2026-01-14'),
          heureDebut: '18:30',
          heureFin: '21:30',
          statut: 'planifie',
        },
        {
          sessionId: sessions[0].id,
          formateurId: formateurs[2].id,
          date: new Date('2026-01-19'),
          heureDebut: '18:30',
          heureFin: '21:30',
          statut: 'planifie',
        },
      ],
    });
    console.log('→ Planning créé');

    // 8. Présences
    console.log('Création des présences...');
    await prisma.presence.createMany({
      data: [
        { stagiaireId: stagiaires[0].id, sessionId: sessions[0].id, date: new Date('2026-01-12'), statut: 'present' },
        { stagiaireId: stagiaires[1].id, sessionId: sessions[0].id, date: new Date('2026-01-12'), statut: 'retard' },
        { stagiaireId: stagiaires[2].id, sessionId: sessions[0].id, date: new Date('2026-01-12'), statut: 'absent' },
      ],
    });
    console.log('→ Présences créées');

    // 9. Utilisateurs (comptes d'authentification)
    console.log('Création des utilisateurs...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const secretairePassword = await bcrypt.hash('secretaire123', 10);
    const formateurPassword = await bcrypt.hash('formateur123', 10);

    await prisma.user.create({
      data: {
        nom: 'Administrateur',
        prenom: 'Admin',
        email: 'admin@formation.com',
        password: adminPassword,
        role: 'admin',
        statut: 'actif',
      },
    });
    console.log('→ Admin créé : admin@formation.com / admin123');

    await prisma.user.create({
      data: {
        nom: 'Secrétariat',
        prenom: 'Secrétaire',
        email: 'secretaire@formation.com',
        password: secretairePassword,
        role: 'secretaire',
        statut: 'actif',
      },
    });
    console.log('→ Secrétaire créé : secretaire@formation.com / secretaire123');

    // Lier les formateurs existants à des comptes User
    await prisma.user.create({
      data: {
        nom: formateurs[0].nom,
        prenom: formateurs[0].prenom,
        email: 'mohamed.formateur@formation.com',
        password: formateurPassword,
        role: 'formateur',
        statut: 'actif',
        formateurId: formateurs[0].id,
      },
    });
    console.log('→ Formateur créé : mohamed.formateur@formation.com / formateur123');

    await prisma.user.create({
      data: {
        nom: formateurs[1].nom,
        prenom: formateurs[1].prenom,
        email: 'sarra.formateur@formation.com',
        password: formateurPassword,
        role: 'formateur',
        statut: 'actif',
        formateurId: formateurs[1].id,
      },
    });
    console.log('→ Formateur créé : sarra.formateur@formation.com / formateur123');

    console.log('\n🌱 Seeding terminé avec succès !');
    console.log('Tu peux maintenant tester toutes les interfaces.');
    console.log('\n📋 Comptes disponibles :');
    console.log('  Admin      : admin@formation.com / admin123');
    console.log('  Secrétaire : secretaire@formation.com / secretaire123');
    console.log('  Formateur  : mohamed.formateur@formation.com / formateur123');
    console.log('  Formateur  : sarra.formateur@formation.com / formateur123');
  } catch (error) {
    console.error('Erreur lors du seeding :', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();