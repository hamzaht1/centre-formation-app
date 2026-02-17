import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function ModifierLivre() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    quantite: '0',
    formationId: '',
  });
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [livresCount, setLivresCount] = useState(null);
  const [originalFormationId, setOriginalFormationId] = useState(null);

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchLivre();
  }, [id]);

  useEffect(() => {
    if (formData.formationId && formData.formationId !== String(originalFormationId)) {
      checkLivresCount(formData.formationId);
    } else {
      setLivresCount(null);
    }
  }, [formData.formationId, originalFormationId]);

  const fetchFormations = async () => {
    try {
      const res = await fetchWithAuth('/api/formations?statut=active&limit=1000');
      if (res.ok) {
        const data = await res.json();
        setFormations(data.data || data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLivre = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/livres/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();

      setFormData({
        nom: data.nom || '',
        prix: data.prix ?? '',
        quantite: data.quantite !== undefined ? String(data.quantite) : '0',
        formationId: data.formationId ? String(data.formationId) : '',
      });
      setOriginalFormationId(data.formationId);
    } catch (err) {
      toast.error('Impossible de charger les données du livre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkLivresCount = async (fId) => {
    try {
      const res = await fetchWithAuth(`/api/livres?formationId=${fId}`);
      if (res.ok) {
        const data = await res.json();
        setLivresCount(data.length);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetchWithAuth(`/api/livres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec mise à jour');
      }

      toast.success('Livre modifié avec succès');
      router.push(`/livres/${id}`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la modification');
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Link href="/livres" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux livres
        </Link>
        <h1 className="text-3xl font-bold mb-8">
          Modifier le livre : {formData.nom}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du livre *</label>
              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prix (TND)</label>
              <input
                name="prix"
                type="number"
                min="0"
                step="0.01"
                value={formData.prix}
                onChange={handleChange}
                placeholder="0"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantite en stock</label>
              <input
                name="quantite"
                type="number"
                min="0"
                step="1"
                value={formData.quantite}
                onChange={handleChange}
                placeholder="0"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Formation *</label>
              <select
                name="formationId"
                value={formData.formationId}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Sélectionner une formation --</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>

              {livresCount !== null && livresCount >= 2 && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  Cette formation a déjà 2 livres (maximum autorisé). Vous ne pourrez pas déplacer ce livre vers cette formation.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push(`/livres/${id}`)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || (livresCount !== null && livresCount >= 2)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
