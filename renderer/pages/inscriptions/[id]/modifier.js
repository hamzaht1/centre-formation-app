import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function ModifierInscription() {
  const router = useRouter();
  const { id } = router.query;

  const [inscription, setInscription] = useState(null);
  const [livresAssignes, setLivresAssignes] = useState([]);
  const [formData, setFormData] = useState({
    montantPaye: '0',
    modePaiement: 'especes',
    statut: 'en_cours',
    noteFinale: '',
    certificatEmis: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [resInscription, resLivres] = await Promise.all([
          fetchWithAuth(`/api/inscriptions/${id}`),
          fetchWithAuth(`/api/livre-stagiaire?inscriptionId=${id}`),
        ]);

        if (!resInscription.ok) throw new Error('Erreur chargement');

        const data = await resInscription.json();
        setInscription(data);

        setFormData({
          montantPaye: data.montantPaye?.toString() || '0',
          statut: data.statut || 'en_cours',
          noteFinale: data.noteFinale?.toString() || '',
          certificatEmis: data.certificatEmis || false,
        });

        if (resLivres.ok) {
          const livresData = await resLivres.json();
          setLivresAssignes(livresData.data || []);
        }
      } catch (err) {
        toast.error("Impossible de charger les données de l'inscription");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetchWithAuth(`/api/inscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec mise à jour');
      }

      toast.success('Inscription modifiée avec succès');
      router.push(`/inscriptions/${id}`);
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
          <div className="text-xl">Chargement des données...</div>
        </div>
      </Layout>
    );
  }

  if (!inscription) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Inscription non trouvée</h2>
        </div>
      </Layout>
    );
  }

  const prixFormation = inscription.session?.formation?.prix ?? 0;
  const prixLivres = livresAssignes.reduce((sum, ls) => sum + (ls.prixUnitaire || 0), 0);

  return (
    <Layout>
      <Link href="/inscriptions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux inscriptions
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Modifier l'inscription
        </h1>
        <p className="text-gray-600 mb-8">
          {inscription.stagiaire?.prenom} {inscription.stagiaire?.nom} → {inscription.session?.formation?.nom}
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          {/* Recap montant total */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Montant total (TND)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Formation : {inscription.session?.formation?.nom || '—'}</span>
                <span className="text-gray-800">{prixFormation.toLocaleString('fr-TN')} TND</span>
              </div>
              {livresAssignes.map((ls) => (
                <div key={ls.id} className="flex justify-between">
                  <span className="text-gray-600">Livre : {ls.livre?.nom || '—'}</span>
                  <span className="text-gray-800">{(ls.prixUnitaire || 0).toLocaleString('fr-TN')} TND</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                <span>Total</span>
                <span className="text-blue-700">{inscription.montantTotal.toLocaleString('fr-TN')} TND</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="block text-sm font-medium mb-1">Mode de paiement</label>
              <select
                name="modePaiement"
                value={formData.modePaiement}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="carte">Carte</option>
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
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="abandonnee">Abandonnée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note finale (/20)</label>
              <input
                name="noteFinale"
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={formData.noteFinale}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                name="certificatEmis"
                checked={formData.certificatEmis}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600"
              />
              <label className="text-sm font-medium">Certificat émis</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push(`/inscriptions/${id}`)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
