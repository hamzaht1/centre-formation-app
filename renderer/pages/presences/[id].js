import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function PresenceDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [presence, setPresence] = useState(null);
  const [formData, setFormData] = useState({
    statut: 'present',
    remarques: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPresence();
  }, [id]);

  const fetchPresence = async () => {
    try {
      const res = await fetchWithAuth(`/api/presences/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');

      const data = await res.json();
      setPresence(data);
      setFormData({
        statut: data.statut || 'present',
        remarques: data.remarques || '',
      });
    } catch (err) {
      toast.error('Impossible de charger la présence');
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
      const res = await fetchWithAuth(`/api/presences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec mise à jour');
      }

      toast.success('Présence modifiée avec succès');
      fetchPresence();
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deletePresence = async () => {
    if (!confirm('Supprimer cette présence ?')) return;

    try {
      const res = await fetchWithAuth(`/api/presences/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Présence supprimée');
      router.push('/presences');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
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

  if (!presence) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Présence non trouvée</h2>
          <button onClick={() => router.push('/presences')} className="mt-4 text-blue-600 hover:underline">
            ← Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/presences" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux présences
      </Link>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Détail de la présence</h1>
          <div className="flex gap-4">
            <button
              onClick={deletePresence}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Supprimer
            </button>
            <button
              onClick={() => router.push('/presences')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Retour
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Informations principales */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Informations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stagiaire</p>
                <p className="text-xl font-medium">
                  {presence.stagiaire?.prenom} {presence.stagiaire?.nom}
                </p>
                <p className="text-gray-600">{presence.stagiaire?.email || '—'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Session / Formation</p>
                <p className="text-xl font-medium">{presence.session?.formation?.nom || '—'}</p>
                <p className="text-gray-600">{presence.session?.nom || '—'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="text-xl font-medium">
                  {new Date(presence.date).toLocaleDateString('fr-TN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Statut actuel</p>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-base font-semibold ${
                    presence.statut === 'present'
                      ? 'bg-green-100 text-green-800'
                      : presence.statut === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : presence.statut === 'retard'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {presence.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Formulaire de modification */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Modifier la présence</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nouveau statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="w-full border rounded px-4 py-3 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="present">Présent</option>
                    <option value="absent">Absent</option>
                    <option value="retard">Retard</option>
                    <option value="justifie">Justifié</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Remarques / Justification</label>
                  <textarea
                    name="remarques"
                    value={formData.remarques}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="Motif du retard, justificatif d'absence, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/presences')}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}