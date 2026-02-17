-- CreateTable
CREATE TABLE "Stagiaire" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "dateNaissance" DATETIME,
    "photo" TEXT,
    "dateInscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "contactUrgence" TEXT,
    "telephoneUrgence" TEXT,
    "profession" TEXT,
    "niveauEtudes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeHeures" INTEGER NOT NULL,
    "prix" REAL NOT NULL,
    "niveau" TEXT NOT NULL DEFAULT 'debutant',
    "prerequis" TEXT,
    "objectifs" TEXT,
    "certificat" TEXT,
    "photo" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "formationId" INTEGER NOT NULL,
    "formateurPrincipalId" INTEGER,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "horaires" TEXT,
    "capaciteMax" INTEGER NOT NULL DEFAULT 20,
    "salle" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'a_venir',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_formateurPrincipalId_fkey" FOREIGN KEY ("formateurPrincipalId") REFERENCES "Formateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Formateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "photo" TEXT,
    "specialites" TEXT,
    "experience" TEXT,
    "cv" TEXT,
    "dateEmbauche" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Disponibilite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formateurId" INTEGER NOT NULL,
    "jourSemaine" INTEGER NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "typeRecurrence" TEXT NOT NULL DEFAULT 'hebdomadaire',
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Disponibilite_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stagiaireId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "dateInscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotal" REAL NOT NULL,
    "montantPaye" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "noteFinale" REAL,
    "certificatEmis" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inscription_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inscription_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Planning" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "formateurId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planning_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planning_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stagiaireId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'present',
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presence_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Presence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stagiaireId" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "datePaiement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL DEFAULT 'especes',
    "reference" TEXT,
    "remarques" TEXT,
    "recu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Paiement_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Stagiaire_email_key" ON "Stagiaire"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Formateur_email_key" ON "Formateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_stagiaireId_sessionId_key" ON "Inscription"("stagiaireId", "sessionId");
