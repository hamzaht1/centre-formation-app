-- CreateTable
CREATE TABLE "Livre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prix" REAL NOT NULL DEFAULT 0,
    "formationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Livre_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Paiement" (
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
    CONSTRAINT "Paiement_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Paiement" ("createdAt", "datePaiement", "id", "modePaiement", "montant", "recu", "reference", "remarques", "stagiaireId", "updatedAt") SELECT "createdAt", "datePaiement", "id", "modePaiement", "montant", "recu", "reference", "remarques", "stagiaireId", "updatedAt" FROM "Paiement";
DROP TABLE "Paiement";
ALTER TABLE "new_Paiement" RENAME TO "Paiement";
CREATE INDEX "Paiement_stagiaireId_idx" ON "Paiement"("stagiaireId");
CREATE TABLE "new_Presence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stagiaireId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'present',
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presence_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Presence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Presence" ("createdAt", "date", "id", "remarques", "sessionId", "stagiaireId", "statut", "updatedAt") SELECT "createdAt", "date", "id", "remarques", "sessionId", "stagiaireId", "statut", "updatedAt" FROM "Presence";
DROP TABLE "Presence";
ALTER TABLE "new_Presence" RENAME TO "Presence";
CREATE INDEX "Presence_stagiaireId_idx" ON "Presence"("stagiaireId");
CREATE INDEX "Presence_sessionId_idx" ON "Presence"("sessionId");
CREATE UNIQUE INDEX "Presence_stagiaireId_sessionId_date_key" ON "Presence"("stagiaireId", "sessionId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Planning_formateurId_idx" ON "Planning"("formateurId");
