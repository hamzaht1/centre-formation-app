import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouvellePresence() {
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);

  const [formData, setFormData] = useState({
    stagiaireId: '',
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'present',
    remarques: '',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSessions, resStagiaires] = await Promise.all([
        fetchWithAuth('/api/sessions'),
        fetchWithAuth('/api/stagiaires?limit=1000'),
      ]);

      if (!resSessions.ok || !resStagiaires.ok) throw new Error('Erreur chargement');

      setSessions(await resSessions.json());
      const stagData = await resStagiaires.json();
      setStagiaires(stagData.data || stagData);
    } catch (err) {
      toast.error('Impossible de charger les sessions ou stagiaires');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.stagiaireId || !formData.sessionId || !formData.date) {
      toast.error('Stagiaire, session et date sont obligatoires');
      return;
    }

    setSaving(true);

    try {
      const res = await fetchWithAuth('/api/presences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur création présence');
      }

      toast.success('Présence enregistrée avec succès');
      router.push('/presences');
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
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
      <Link href="/presences" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux présences
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Nouvelle Présence</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Stagiaire *</label>
              <select
                name="stagiaireId"
                value={formData.stagiaireId}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner un stagiaire</option>
                {stagiaires.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prenom} {s.nom} {s.email ? `(${s.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session *</label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner une session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.formation?.nom} — {s.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Statut *</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
                <option value="retard">Retard</option>
                <option value="justifie">Justifié</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Remarques</label>
            <textarea
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Justification d'absence, motif du retard, etc."
            />
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la présence'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}