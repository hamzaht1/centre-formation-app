import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouveauPaiement() {
  const router = useRouter();

  const [stagiaires, setStagiaires] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    stagiaireId: '',
    montant: '',
    datePaiement: new Date().toISOString().split('T')[0],
    modePaiement: 'especes',
    reference: '',
    remarques: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStagiaires();
  }, []);

  const fetchStagiaires = async () => {
    try {
      const res = await fetchWithAuth('/api/stagiaires?limit=1000');
      if (!res.ok) throw new Error('Erreur chargement stagiaires');
      const data = await res.json();
      setStagiaires(data.data || data);
    } catch (err) {
      toast.error('Impossible de charger la liste des stagiaires');
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

    if (!formData.stagiaireId || !formData.montant || parseFloat(formData.montant) <= 0) {
      toast.error('Stagiaire et montant positif obligatoires');
      return;
    }

    setSaving(true);

    try {
      const res = await fetchWithAuth('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l’enregistrement');
      }

      toast.success('Paiement enregistré avec succès');
      router.push('/paiements');
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
          <div className="text-xl">Chargement des stagiaires...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/paiements" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux paiements
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Enregistrer un nouveau paiement</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stagiaire *
              </label>
              <select
                name="stagiaireId"
                value={formData.stagiaireId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (DT) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="ex: 250.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du paiement *
              </label>
              <input
                type="date"
                name="datePaiement"
                value={formData.datePaiement}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de paiement *
              </label>
              <select
                name="modePaiement"
                value={formData.modePaiement}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement bancaire</option>
                <option value="carte">Carte bancaire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence (numéro chèque, virement, etc.)
            </label>
            <input
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ex: CHQ-2025-0456 ou VIR-REF-789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarques / Observations
            </label>
            <textarea
              name="remarques"
              value={formData.remarques || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ex: Paiement partiel pour la formation X, reçu remis, etc."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/paiements')}
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}