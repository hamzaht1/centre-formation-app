import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

const NIVEAUX_LANGUE = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SOUS_NIVEAUX = {
  'A1': ['a1-1', 'a1-2'],
  'A2': ['a2-1', 'a2-2'],
  'B1': ['b1-1', 'b1-2', 'b1-3'],
};

export default function ModifierFormation() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dureeHeures: '',
    prix: '',
    niveau: 'debutant',
    niveauDetail: '',
    categorie: 'langue',
    typePublic: 'tout_public',
    prerequis: '',
    objectifs: '',
    certificat: '',
    statut: 'active',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchFormation();
  }, [id]);

  const fetchFormation = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/formations/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');

      const data = await res.json();
      setFormData({
        nom: data.nom || '',
        description: data.description || '',
        dureeHeures: data.dureeHeures || '',
        prix: data.prix || '',
        niveau: data.niveau || 'debutant',
        niveauDetail: data.niveauDetail || '',
        categorie: data.categorie || 'langue',
        typePublic: data.typePublic || 'tout_public',
        prerequis: data.prerequis || '',
        objectifs: data.objectifs || '',
        certificat: data.certificat || '',
        statut: data.statut || 'active',
      });
    } catch (err) {
      toast.error('Impossible de charger les données de la formation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Reset niveauDetail si on change de niveau
    if (name === 'niveau') {
      setFormData(prev => ({ ...prev, niveauDetail: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetchWithAuth(`/api/formations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec mise à jour');
      }

      toast.success('Formation modifiée avec succès');
      router.push(`/formations/${id}`);
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des données...</div>
        </div>
      </Layout>
    );
  }

  const afficherSousNiveaux = NIVEAUX_LANGUE.includes(formData.niveau) && SOUS_NIVEAUX[formData.niveau];

  return (
    <Layout>
      <Link href="/formations" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux formations
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Modifier la formation : {formData.nom || 'Chargement...'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nom de la formation *</label>
              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
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

            <div>
              <label className="block text-sm font-medium mb-1">Durée (heures) *</label>
              <input
                name="dureeHeures"
                type="number"
                value={formData.dureeHeures}
                onChange={handleChange}
                required
                min="1"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prix (TND) *</label>
              <input
                name="prix"
                type="number"
                step="0.01"
                value={formData.prix}
                onChange={handleChange}
                required
                min="0"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Niveau *</label>
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
                <option value="tout_niveau">Tout niveau</option>
                <optgroup label="Niveaux CECRL">
                  {NIVEAUX_LANGUE.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {afficherSousNiveaux && (
              <div>
                <label className="block text-sm font-medium mb-1">Sous-niveau</label>
                <select
                  name="niveauDetail"
                  value={formData.niveauDetail}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Aucun</option>
                  {SOUS_NIVEAUX[formData.niveau].map(sn => (
                    <option key={sn} value={sn}>{sn.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

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
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prérequis</label>
            <textarea
              name="prerequis"
              value={formData.prerequis}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Objectifs pédagogiques</label>
            <textarea
              name="objectifs"
              value={formData.objectifs}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Certificat délivré</label>
            <input
              name="certificat"
              value={formData.certificat}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push(`/formations/${id}`)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}