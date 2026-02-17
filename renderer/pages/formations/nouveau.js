import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

const LANGUES_CONFIG = {
  'Français': { 
    duree: 30, 
    niveaux: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    sousNiveaux: {} 
  },
  'Anglais': { 
    duree: null,
    niveaux: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    sousNiveaux: {},
    types: [
      { label: 'Kids', duree: 30, typePublic: 'kids' },
      { label: 'Adultes', duree: 45, typePublic: 'adultes' }
    ]
  },
  'Allemand': { 
    duree: 45, 
    niveaux: ['A1', 'A2', 'B1', 'B2'],
    sousNiveaux: {
      'A1': ['a1-1', 'a1-2'],
      'A2': ['a2-1', 'a2-2'],
      'B1': ['b1-1', 'b1-2', 'b1-3']
    }
  },
  'Italien': { 
    duree: 30, 
    niveaux: ['A1', 'A2', 'B1', 'B2'],
    sousNiveaux: {}
  },
  'Espagnol': { 
    duree: 30, 
    niveaux: ['A1', 'A2', 'B1', 'B2', 'C1'],
    sousNiveaux: {}
  },
  'Informatique': { 
    duree: 30, 
    niveaux: [],
    sousNiveaux: {}
  }
};

export default function NouvelleFormation() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'langue',
    dureeHeures: '',
    prix: '',
    niveau: '',
    niveauDetail: '',
    typePublic: 'tout_public',
    description: '',
    prerequis: '',
    objectifs: '',
    certificat: '',
    statut: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [selectedLangue, setSelectedLangue] = useState('');
  const [modeManuel, setModeManuel] = useState(false);

  const handleLangueChange = (langue) => {
    setSelectedLangue(langue);
    const config = LANGUES_CONFIG[langue];
    
    setFormData(prev => ({
      ...prev,
      nom: langue,
      categorie: langue === 'Informatique' ? 'informatique' : 'langue',
      dureeHeures: config.duree || (langue === 'Informatique' ? 30 : ''),
      niveau: '',
      niveauDetail: '',
      typePublic: 'tout_public',
    }));
  };

  const handleNiveauSelect = (niveau) => {
    setFormData(prev => ({
      ...prev,
      niveau: niveau,
      niveauDetail: '',
    }));
  };

  const handleSousNiveauSelect = (sousNiveau) => {
    setFormData(prev => ({
      ...prev,
      niveauDetail: sousNiveau,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (selectedLangue && !modeManuel && !formData.niveau && langueConfig?.niveaux?.length > 0) {
      toast.error('Veuillez sélectionner un niveau');
      return;
    }

    setSaving(true);

    try {
      const res = await fetchWithAuth('/api/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Erreur création');

      toast.success('Formation créée avec succès');
      router.push('/formations');
    } catch (err) {
      toast.error('Erreur lors de la création');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const langueConfig = selectedLangue ? LANGUES_CONFIG[selectedLangue] : null;
  const afficherSousNiveaux = langueConfig?.sousNiveaux?.[formData.niveau]?.length > 0;

  return (
    <Layout>
      <Link href="/formations" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux formations
      </Link>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Nouvelle Formation</h1>
          <button
            type="button"
            onClick={() => {
              setModeManuel(!modeManuel);
              setSelectedLangue('');
            }}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            {modeManuel ? '← Mode assistant' : 'Mode manuel →'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!modeManuel && (
            <>
              {/* Sélection rapide des langues */}
              <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Étape 1 : Choisir la formation</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Langues disponibles</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.keys(LANGUES_CONFIG).filter(l => l !== 'Informatique').map((langue) => (
                      <button
                        key={langue}
                        type="button"
                        onClick={() => handleLangueChange(langue)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          selectedLangue === langue
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-300 hover:border-blue-300 hover:shadow'
                        }`}
                      >
                        {langue}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Informatique</label>
                  <button
                    type="button"
                    onClick={() => handleLangueChange('Informatique')}
                    className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                      selectedLangue === 'Informatique'
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                        : 'border-gray-300 hover:border-green-300 hover:shadow'
                    }`}
                  >
                    💻 Informatique
                  </button>
                </div>
              </div>

              {/* Configuration spécifique à la langue */}
              {selectedLangue && langueConfig && (
                <>
                  {/* Types pour Anglais */}
                  {selectedLangue === 'Anglais' && langueConfig.types && (
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-4">
                        Étape 2 : Type de public (Anglais)
                      </h3>
                      <div className="flex gap-4">
                        {langueConfig.types.map((type) => (
                          <button
                            key={type.label}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                typePublic: type.typePublic,
                                dureeHeures: type.duree,
                              }));
                            }}
                            className={`flex-1 px-6 py-4 rounded-lg border-2 font-medium transition-all ${
                              formData.typePublic === type.typePublic
                                ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md'
                                : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow'
                            }`}
                          >
                            <div className="text-lg font-bold">{type.label}</div>
                            <div className="text-sm mt-1">{type.duree} heures</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sélection des niveaux CECRL */}
                  {langueConfig.niveaux && langueConfig.niveaux.length > 0 && (
                    <div className="bg-white p-8 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-6">
                        {selectedLangue === 'Anglais' ? 'Étape 3' : 'Étape 2'} : Choisir le niveau
                      </h3>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">Niveau CECRL</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {langueConfig.niveaux.map((niveau) => (
                            <button
                              key={niveau}
                              type="button"
                              onClick={() => handleNiveauSelect(niveau)}
                              className={`px-6 py-4 rounded-lg border-2 font-bold text-lg transition-all ${
                                formData.niveau === niveau
                                  ? 'border-purple-600 bg-purple-100 text-purple-900 shadow-lg transform scale-105'
                                  : 'border-gray-300 bg-white hover:border-purple-400 hover:shadow'
                              }`}
                            >
                              {niveau}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sous-niveaux (pour Allemand) */}
                      {afficherSousNiveaux && (
                        <div className="mt-6 pt-6 border-t">
                          <label className="block text-sm font-medium mb-3">
                            Sous-niveau pour {formData.niveau}
                          </label>
                          <div className="flex gap-3 flex-wrap">
                            {langueConfig.sousNiveaux[formData.niveau].map((sousNiveau) => (
                              <button
                                key={sousNiveau}
                                type="button"
                                onClick={() => handleSousNiveauSelect(sousNiveau)}
                                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                                  formData.niveauDetail === sousNiveau
                                    ? 'border-indigo-600 bg-indigo-100 text-indigo-900 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-indigo-400 hover:shadow'
                                }`}
                              >
                                {sousNiveau.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Résumé de la sélection */}
                      {formData.niveau && (
                        <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="font-semibold">Sélection actuelle :</span>
                          </div>
                          <div className="mt-2 text-sm text-green-900">
                            <strong>{formData.nom}</strong>
                            {' - Niveau '}
                            <strong>{formData.niveau}</strong>
                            {formData.niveauDetail && (
                              <> ({formData.niveauDetail.toUpperCase()})</>
                            )}
                            {formData.typePublic !== 'tout_public' && (
                              <> - {formData.typePublic === 'kids' ? 'Enfants' : 'Adultes'}</>
                            )}
                            {' - '}
                            <strong>{formData.dureeHeures} heures</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Détails de la formation */}
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">
              {modeManuel ? 'Informations' : `${selectedLangue === 'Anglais' ? 'Étape 4' : langueConfig?.niveaux?.length > 0 ? 'Étape 3' : 'Étape 2'} : Détails`} de la formation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modeManuel && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom de la formation *</label>
                    <input
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="ex: Français, Anglais, Allemand..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Catégorie *</label>
                    <select
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="langue">Langue</option>
                      <option value="informatique">Informatique</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Niveau</label>
                    <input
                      name="niveau"
                      value={formData.niveau}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="ex: A1, A2, B1, débutant..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sous-niveau (optionnel)</label>
                    <input
                      name="niveauDetail"
                      value={formData.niveauDetail}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="ex: a1-1, b1-2..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type de public</label>
                    <select
                      name="typePublic"
                      value={formData.typePublic}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="tout_public">Tout public</option>
                      <option value="kids">Enfants</option>
                      <option value="adultes">Adultes</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Durée (heures) *</label>
                <input
                  name="dureeHeures"
                  type="number"
                  min="1"
                  value={formData.dureeHeures}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prix (TND) *</label>
                <input
                  name="prix"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prix}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="500"
                />
              </div>

              {!modeManuel && (
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archivee">Archivée</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Description de la formation..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">Prérequis</label>
                <textarea
                  name="prerequis"
                  value={formData.prerequis}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Aucun prérequis ou niveau minimum requis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Objectifs</label>
                <textarea
                  name="objectifs"
                  value={formData.objectifs}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Objectifs pédagogiques..."
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Certificat délivré</label>
              <input
                name="certificat"
                value={formData.certificat}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="ex: Certificat de niveau A1, Attestation de formation..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/formations')}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Créer la formation'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}