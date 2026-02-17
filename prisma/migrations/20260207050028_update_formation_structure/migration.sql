-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Formation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeHeures" INTEGER NOT NULL,
    "prix" REAL NOT NULL,
    "niveau" TEXT NOT NULL DEFAULT 'debutant',
    "categorie" TEXT NOT NULL DEFAULT 'autre',
    "typePublic" TEXT,
    "niveauDetail" TEXT,
    "prerequis" TEXT,
    "objectifs" TEXT,
    "certificat" TEXT,
    "photo" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Formation" ("certificat", "createdAt", "description", "dureeHeures", "id", "niveau", "nom", "objectifs", "photo", "prerequis", "prix", "statut", "updatedAt") SELECT "certificat", "createdAt", "description", "dureeHeures", "id", "niveau", "nom", "objectifs", "photo", "prerequis", "prix", "statut", "updatedAt" FROM "Formation";
DROP TABLE "Formation";
ALTER TABLE "new_Formation" RENAME TO "Formation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
