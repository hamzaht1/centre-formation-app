import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function ModifierSession() {
  const router = useRouter();
  const { id } = router.query;

  const [formations, setFormations] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    formationId: '',
    formateurPrincipalId: '',
    dateDebut: '',
    dateFin: '',
    horaires: '',
    capaciteMax: '20',
    statut: 'a_venir',
  });

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [resSession, resFormations, resFormateurs] = await Promise.all([
        fetchWithAuth(`/api/sessions/${id}`),
        fetchWithAuth('/api/formations?limit=1000'),
        fetchWithAuth('/api/formateurs'),
      ]);

      if (!resSession.ok) throw new Error('Session non trouvée');

      const session = await resSession.json();
      const formationsData = await resFormations.json();
      const formateursData = await resFormateurs.json();

      setFormations(formationsData.data || formationsData);
      setFormateurs(formateursData);

      setFormData({
        nom: session.nom || '',
        formationId: session.formationId?.toString() || '',
        formateurPrincipalId: session.formateurPrincipalId?.toString() || '',
        dateDebut: session.dateDebut ? new Date(session.dateDebut).toISOString().split('T')[0] : '',
        dateFin: session.dateFin ? new Date(session.dateFin).toISOString().split('T')[0] : '',
        horaires: session.horaires || '',
        capaciteMax: session.capaciteMax?.toString() || '20',
        statut: session.statut || 'a_venir',
      });
    } catch (err) {
      toast.error('Impossible de charger les données');
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
      const res = await fetchWithAuth(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur mise à jour');
      }

      toast.success('Session modifiée avec succès');
      router.push(`/sessions/${id}`);
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
          <div className="text-xl">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/sessions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux sessions
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Modifier la session
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la session *
              </label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formation *
              </label>
              <select
                name="formationId"
                required
                value={formData.formationId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner une formation</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formateur principal
              </label>
              <select
                name="formateurPrincipalId"
                value={formData.formateurPrincipalId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Aucun formateur</option>
                {formateurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom} {f.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                name="dateDebut"
                required
                value={formData.dateDebut}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                name="dateFin"
                required
                value={formData.dateFin}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horaires
              </label>
              <input
                type="text"
                name="horaires"
                value={formData.horaires}
                onChange={handleChange}
                placeholder="Ex: Lun-Mer-Ven 9h-12h"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité maximale *
              </label>
              <input
                type="number"
                name="capaciteMax"
                required
                min="1"
                value={formData.capaciteMax}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="a_venir">À venir</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.push(`/sessions/${id}`)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
