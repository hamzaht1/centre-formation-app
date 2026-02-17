import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouveauLivre() {
  const router = useRouter();
  const { formationId: queryFormationId } = router.query;

  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    quantite: '0',
    formationId: '',
  });
  const [formations, setFormations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [livresCount, setLivresCount] = useState(null);

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    if (queryFormationId && !formData.formationId) {
      setFormData((prev) => ({ ...prev, formationId: queryFormationId }));
    }
  }, [queryFormationId]);

  useEffect(() => {
    if (formData.formationId) {
      checkLivresCount(formData.formationId);
    } else {
      setLivresCount(null);
    }
  }, [formData.formationId]);

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
      const res = await fetchWithAuth('/api/livres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur création');
      }

      toast.success('Livre créé avec succès');
      router.push('/livres');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Link href="/livres" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux livres
        </Link>
        <h1 className="text-3xl font-bold mb-8">Nouveau Livre</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du livre *</label>
              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                placeholder="ex: Manuel de français A1"
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
                  Cette formation a déjà 2 livres (maximum autorisé). Vous ne pourrez pas en ajouter un nouveau.
                </p>
              )}
              {livresCount !== null && livresCount === 1 && (
                <p className="mt-2 text-sm text-orange-600">
                  Cette formation a déjà 1 livre. Vous pouvez en ajouter 1 de plus.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/livres')}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || livresCount >= 2}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Créer le livre'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
