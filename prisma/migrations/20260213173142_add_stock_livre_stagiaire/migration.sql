-- CreateTable
CREATE TABLE "LivreStagiaire" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "livreId" INTEGER NOT NULL,
    "stagiaireId" INTEGER NOT NULL,
    "inscriptionId" INTEGER,
    "paiementId" INTEGER,
    "prixUnitaire" REAL NOT NULL,
    "dateAttribution" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LivreStagiaire_livreId_fkey" FOREIGN KEY ("livreId") REFERENCES "Livre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LivreStagiaire_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LivreStagiaire_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Livre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prix" REAL NOT NULL DEFAULT 0,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "formationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Livre_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Livre" ("createdAt", "formationId", "id", "nom", "prix", "updatedAt") SELECT "createdAt", "formationId", "id", "nom", "prix", "updatedAt" FROM "Livre";
DROP TABLE "Livre";
ALTER TABLE "new_Livre" RENAME TO "Livre";
CREATE TABLE "new_Paiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stagiaireId" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "datePaiement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL DEFAULT 'especes',
    "typePaiement" TEXT NOT NULL DEFAULT 'inscription',
    "reference" TEXT,
    "remarques" TEXT,
    "recu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Paiement_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Paiement" ("createdAt", "datePaiement", "id", "modePaiement", "montant", "recu", "reference", "remarques", "stagiaireId", "updatedAt") SELECT "createdAt", "datePaiement", "id", "modePaiement", "montant", "recu", "reference", "remarques", "stagiaireId", "updatedAt" FROM "Paiement";
DROP TABLE "Paiement";
ALTER TABLE "new_Paiement" RENAME TO "Paiement";
CREATE INDEX "Paiement_stagiaireId_idx" ON "Paiement"("stagiaireId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LivreStagiaire_stagiaireId_idx" ON "LivreStagiaire"("stagiaireId");

-- CreateIndex
CREATE INDEX "LivreStagiaire_livreId_idx" ON "LivreStagiaire"("livreId");

-- CreateIndex
CREATE UNIQUE INDEX "LivreStagiaire_livreId_stagiaireId_inscriptionId_key" ON "LivreStagiaire"("livreId", "stagiaireId", "inscriptionId");
