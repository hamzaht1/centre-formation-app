/*
  Warnings:

  - You are about to drop the column `salle` on the `Planning` table. All the data in the column will be lost.
  - You are about to drop the column `salle` on the `Session` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Salle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "equipements" TEXT,
    "batiment" TEXT,
    "etage" TEXT,
    "type" TEXT NOT NULL DEFAULT 'cours',
    "statut" TEXT NOT NULL DEFAULT 'disponible',
    "photo" TEXT,
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planning" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "formateurId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "remarques" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "salleId" INTEGER,
    CONSTRAINT "Planning_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planning_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Planning_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Planning" ("createdAt", "date", "formateurId", "heureDebut", "heureFin", "id", "remarques", "sessionId", "statut", "updatedAt") SELECT "createdAt", "date", "formateurId", "heureDebut", "heureFin", "id", "remarques", "sessionId", "statut", "updatedAt" FROM "Planning";
DROP TABLE "Planning";
ALTER TABLE "new_Planning" RENAME TO "Planning";
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "formationId" INTEGER NOT NULL,
    "formateurPrincipalId" INTEGER,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "horaires" TEXT,
    "capaciteMax" INTEGER NOT NULL DEFAULT 20,
    "statut" TEXT NOT NULL DEFAULT 'a_venir',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "salleId" INTEGER,
    CONSTRAINT "Session_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_formateurPrincipalId_fkey" FOREIGN KEY ("formateurPrincipalId") REFERENCES "Formateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Session_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("capaciteMax", "createdAt", "dateDebut", "dateFin", "formateurPrincipalId", "formationId", "horaires", "id", "nom", "statut", "updatedAt") SELECT "capaciteMax", "createdAt", "dateDebut", "dateFin", "formateurPrincipalId", "formationId", "horaires", "id", "nom", "statut", "updatedAt" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Salle_nom_key" ON "Salle"("nom");
