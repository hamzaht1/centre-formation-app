import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function ModifierSalle() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    nom: '',
    capacite: '',
    equipements: '',
    batiment: '',
    etage: '',
    type: 'cours',
    statut: 'disponible',
    remarques: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchSalle();
  }, [id]);

  const fetchSalle = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/salles/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();

      setFormData({
        nom: data.nom || '',
        capacite: data.capacite || '',
        equipements: data.equipements || '',
        batiment: data.batiment || '',
        etage: data.etage || '',
        type: data.type || 'cours',
        statut: data.statut || 'disponible',
        remarques: data.remarques || '',
      });
    } catch (err) {
      toast.error('Impossible de charger les données de la salle');
      console.error(err);
    } finally {
      setLoading(false);
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
      const res = await fetchWithAuth(`/api/salles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec mise à jour');
      }

      toast.success('Salle modifiée avec succès');
      router.push(`/salles/${id}`);
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
        <Link href="/salles" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux salles
        </Link>
        <h1 className="text-3xl font-bold mb-8">
          Modifier la salle : {formData.nom}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de la salle *</label>
              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Capacité *</label>
              <input
                name="capacite"
                type="number"
                min="1"
                value={formData.capacite}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bâtiment</label>
              <input
                name="batiment"
                value={formData.batiment}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Étage</label>
              <input
                name="etage"
                value={formData.etage}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type de salle</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="cours">Cours</option>
                <option value="informatique">Informatique</option>
                <option value="conference">Conférence</option>
                <option value="atelier">Atelier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="disponible">Disponible</option>
                <option value="maintenance">En maintenance</option>
                <option value="indisponible">Indisponible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Équipements</label>
            <textarea
              name="equipements"
              value={formData.equipements}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="ex: Projecteur, 20 ordinateurs, Tableau blanc interactif..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarques</label>
            <textarea
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push(`/salles/${id}`)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
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