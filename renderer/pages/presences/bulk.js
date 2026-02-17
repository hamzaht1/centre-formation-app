import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function BulkPresences() {
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [presences, setPresences] = useState([]); // tableau {stagiaireId, statut, remarques}
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSess, resStag] = await Promise.all([
        fetchWithAuth('/api/sessions'),
        fetchWithAuth('/api/stagiaires?limit=1000'),
      ]);

      if (!resSess.ok || !resStag.ok) throw new Error('Erreur chargement');

      setSessions(await resSess.json());
      const stagData = await resStag.json();
      setStagiaires(stagData.data || stagData);
    } catch (err) {
      toast.error('Impossible de charger les sessions ou stagiaires');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (formData.sessionId) {
      // Charger les stagiaires inscrits à cette session
      fetchInscrits();
    }
  }, [formData.sessionId]);

  const fetchInscrits = async () => {
    try {
      const res = await fetchWithAuth(`/api/inscriptions?sessionId=${formData.sessionId}`);
      if (!res.ok) throw new Error('Erreur inscriptions');
      const result = await res.json();
      const inscrits = result.data || result;

      // Initialiser presences avec tous les inscrits → présent par défaut
      const initialPresences = inscrits.map((ins) => ({
        stagiaireId: ins.stagiaireId,
        statut: 'present',
        remarques: '',
      }));

      setPresences(initialPresences);
    } catch (err) {
      toast.error('Impossible de charger les inscrits');
    }
  };

  const handleStatutChange = (stagiaireId, statut) => {
    setPresences((prev) =>
      prev.map((p) =>
        p.stagiaireId === stagiaireId ? { ...p, statut } : p
      )
    );
  };

  const handleRemarquesChange = (stagiaireId, remarques) => {
    setPresences((prev) =>
      prev.map((p) =>
        p.stagiaireId === stagiaireId ? { ...p, remarques } : p
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sessionId || !formData.date) {
      toast.error('Session et date sont obligatoires');
      return;
    }

    if (presences.length === 0) {
      toast.error('Aucun stagiaire à marquer');
      return;
    }

    setSaving(true);

    try {
      const payload = presences.map((p) => ({
        ...p,
        date: formData.date,
        sessionId: formData.sessionId,
      }));

      const res = await fetchWithAuth('/api/presences/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presences: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec enregistrement');
      }

      toast.success('Présences enregistrées avec succès');
      router.push('/presences');
    } catch (err) {
      toast.error(err.message);
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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Marquage massif des présences</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Session *</label>
              <select
                value={formData.sessionId}
                onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choisir une session</option>
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
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {formData.sessionId && presences.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Marquage pour {presences.length} stagiaires inscrits
              </h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto border rounded p-4 bg-gray-50">
                {presences.map((p) => {
                  const stagiaire = stagiaires.find((s) => s.id === p.stagiaireId);
                  return (
                    <div key={p.stagiaireId} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex-1">
                        <p className="font-medium">
                          {stagiaire?.prenom} {stagiaire?.nom}
                        </p>
                        <p className="text-sm text-gray-600">{stagiaire?.email || '—'}</p>
                      </div>

                      <div className="flex gap-3 items-center">
                        <select
                          value={p.statut}
                          onChange={(e) => handleStatutChange(p.stagiaireId, e.target.value)}
                          className="border rounded px-3 py-2 bg-white"
                        >
                          <option value="present">Présent</option>
                          <option value="absent">Absent</option>
                          <option value="retard">Retard</option>
                          <option value="justifie">Justifié</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Remarques..."
                          value={p.remarques}
                          onChange={(e) => handleRemarquesChange(p.stagiaireId, e.target.value)}
                          className="border rounded px-3 py-2 flex-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : formData.sessionId ? (
            <p className="text-center text-gray-500 py-8">
              Aucun stagiaire inscrit à cette session
            </p>
          ) : null}

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
              disabled={saving || presences.length === 0}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer toutes les présences'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}