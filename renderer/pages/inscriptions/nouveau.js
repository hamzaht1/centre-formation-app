import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouvelleInscription() {
  const router = useRouter();

  const [stagiaires, setStagiaires] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [formData, setFormData] = useState({
    stagiaireId: '',
    sessionId: '',
    montantPaye: '0',
    statut: 'en_cours',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionLivres, setSessionLivres] = useState([]);
  const [selectedLivreIds, setSelectedLivreIds] = useState([]);

  const selectedSession = useMemo(() => {
    if (!formData.sessionId) return null;
    return sessions.find((s) => String(s.id) === String(formData.sessionId)) || null;
  }, [formData.sessionId, sessions]);

  const prixFormation = selectedSession?.formation?.prix ?? 0;

  const prixLivres = useMemo(() => {
    return sessionLivres
      .filter((l) => selectedLivreIds.includes(l.id) && l.quantite > 0)
      .reduce((sum, l) => sum + l.prix, 0);
  }, [sessionLivres, selectedLivreIds]);

  const montantTotal = formData.sessionId ? prixFormation + prixLivres : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStag, resSess] = await Promise.all([
          fetchWithAuth('/api/stagiaires?limit=1000'),
          fetchWithAuth('/api/sessions'),
        ]);

        if (!resStag.ok || !resSess.ok) throw new Error('Erreur chargement données');

        const stagData = await resStag.json();
        const sessData = await resSess.json();

        setStagiaires(stagData.data || stagData);
        setSessions(sessData);
      } catch (err) {
        toast.error('Impossible de charger les stagiaires ou sessions');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Fetch livres when session changes
  useEffect(() => {
    if (formData.sessionId) {
      const session = sessions.find((s) => String(s.id) === String(formData.sessionId));
      if (session?.formationId) {
        fetchSessionLivres(session.formationId);
      }
    } else {
      setSessionLivres([]);
      setSelectedLivreIds([]);
    }
  }, [formData.sessionId, sessions]);

  const fetchSessionLivres = async (formationId) => {
    try {
      const res = await fetchWithAuth(`/api/livres?formationId=${formationId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionLivres(data);
        // Pre-select all books that are in stock
        setSelectedLivreIds(data.filter((l) => l.quantite > 0).map((l) => l.id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLivreToggle = (livreId) => {
    setSelectedLivreIds((prev) =>
      prev.includes(livreId)
        ? prev.filter((id) => id !== livreId)
        : [...prev, livreId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stagiaireId || !formData.sessionId) {
      toast.error('Veuillez sélectionner un stagiaire et une session');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        montantTotal,
        assignerLivres: selectedLivreIds.length > 0,
        selectedLivreIds,
      };

      const res = await fetchWithAuth('/api/inscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur création inscription');
      }

      toast.success('Inscription créée avec succès');
      router.push('/inscriptions');
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
      <Link href="/inscriptions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux inscriptions
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Nouvelle Inscription</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Stagiaire *</label>
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
              <label className="block text-sm font-medium mb-1">Session / Formation *</label>
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
                    {s.formation?.nom || '—'} — {s.nom} ({new Date(s.dateDebut).toLocaleDateString('fr-TN')})
                  </option>
                ))}
              </select>
            </div>

            {sessionLivres.length > 0 && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Livres de la formation</h3>
                <div className="space-y-2">
                  {sessionLivres.map((livre) => {
                    const inStock = livre.quantite > 0;
                    const isSelected = selectedLivreIds.includes(livre.id);
                    return (
                      <label
                        key={livre.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                          isSelected ? 'bg-blue-100' : 'bg-white'
                        } ${!inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleLivreToggle(livre.id)}
                            disabled={!inStock}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700">{livre.nom}</span>
                        </div>
                        <span className="flex gap-3 text-sm">
                          <span className="font-medium text-gray-800">{livre.prix.toLocaleString('fr-TN')} TND</span>
                          <span className={`${inStock ? 'text-green-600' : 'text-red-600'}`}>
                            Stock: {livre.quantite}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recap montant total */}
            <div className="md:col-span-2 bg-gray-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Montant total (TND)</h3>
              {formData.sessionId ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formation : {selectedSession?.formation?.nom || '—'}</span>
                    <span className="text-gray-800">{prixFormation.toLocaleString('fr-TN')} TND</span>
                  </div>
                  {sessionLivres
                    .filter((l) => selectedLivreIds.includes(l.id) && l.quantite > 0)
                    .map((livre) => (
                      <div key={livre.id} className="flex justify-between">
                        <span className="text-gray-600">Livre : {livre.nom}</span>
                        <span className="text-gray-800">{livre.prix.toLocaleString('fr-TN')} TND</span>
                      </div>
                    ))}
                  <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                    <span>Total</span>
                    <span className="text-blue-700">{Number(montantTotal).toLocaleString('fr-TN')} TND</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Sélectionnez une session</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Montant payé (TND)</label>
              <input
                name="montantPaye"
                type="number"
                step="0.01"
                min="0"
                value={formData.montantPaye}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="abandonnee">Abandonnée</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/inscriptions')}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : "Créer l'inscription"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
