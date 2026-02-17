import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouvelleSeance() {
  const router = useRouter();

  const [formateurs, setFormateurs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [modules, setModules] = useState([]);
  const [salles, setSalles] = useState([]);
  const [salleCheck, setSalleCheck] = useState(null);
  const [checkingSalle, setCheckingSalle] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    heureDebut: '',
    heureFin: '',
    sessionId: '',
    moduleId: '',
    formateurId: '',
    salleId: '',
    statut: 'planifie',
    remarques: '',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resForm, resSess, resMod, resSalles] = await Promise.all([
          fetchWithAuth('/api/formateurs'),
          fetchWithAuth('/api/sessions'),
          fetchWithAuth('/api/modules'),
          fetchWithAuth('/api/salles'),
        ]);

        if (resForm.ok) setFormateurs(await resForm.json());
        if (resSess.ok) setSessions(await resSess.json());
        if (resMod.ok) setModules(await resMod.json());
        if (resSalles.ok) setSalles(await resSalles.json());
      } catch (err) {
        toast.error('Erreur chargement des données');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Vérifier la disponibilité de la salle
  useEffect(() => {
    if (!formData.salleId || !formData.date || !formData.heureDebut || !formData.heureFin) {
      setSalleCheck(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSalle(true);
      try {
        const params = new URLSearchParams({
          salleId: formData.salleId,
          date: formData.date,
          heureDebut: formData.heureDebut,
          heureFin: formData.heureFin,
        });
        const res = await fetchWithAuth(`/api/disponibilites/check?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSalleCheck(data);
        }
      } catch (err) {
        console.error('Erreur vérification salle:', err);
      } finally {
        setCheckingSalle(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.salleId, formData.date, formData.heureDebut, formData.heureFin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sessionId || !formData.moduleId || !formData.formateurId || !formData.date) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const res = await fetchWithAuth('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur création séance');
      }

      toast.success('Séance créée avec succès');
      router.push('/planning');
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
      <div className="max-w-4xl mx-auto">
        <Link href="/planning" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au planning
        </Link>
        <h1 className="text-3xl font-bold mb-8">Nouvelle Séance</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Heure début *</label>
                <input
                  type="time"
                  name="heureDebut"
                  value={formData.heureDebut}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heure fin *</label>
                <input
                  type="time"
                  name="heureFin"
                  value={formData.heureFin}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Session *</label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
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
              <label className="block text-sm font-medium mb-1">Module *</label>
              <select
                name="moduleId"
                value={formData.moduleId}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choisir un module</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Formateur *</label>
              <select
                name="formateurId"
                value={formData.formateurId}
                onChange={handleChange}
                required
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choisir un formateur</option>
                {formateurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.prenom} {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Salle</label>
              <select
                name="salleId"
                value={formData.salleId}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Aucune salle</option>
                {salles.filter(s => s.statut === 'disponible').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} ({s.capacite} places)
                  </option>
                ))}
              </select>
              {checkingSalle && (
                <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  Vérification...
                </div>
              )}
              {!checkingSalle && salleCheck && salleCheck.checks?.salle && (
                <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                  salleCheck.checks.salle.disponible
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {salleCheck.checks.salle.disponible ? (
                    <span className="font-medium">Salle disponible</span>
                  ) : (
                    <div>
                      <span className="font-medium">Salle occupée</span>
                      {salleCheck.checks.salle.conflitsJour && salleCheck.checks.salle.conflitsJour.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {salleCheck.checks.salle.conflitsJour.map((c, i) => (
                            <li key={i}>{c.horaire} — {c.formation} ({c.formateur})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="planifie">Planifié</option>
                <option value="effectue">Effectué</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarques</label>
            <textarea
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Annulations, reports, matériel nécessaire..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/planning')}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Créer la séance'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}