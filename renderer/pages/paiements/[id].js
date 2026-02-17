import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function PaiementDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPaiement();
  }, [id]);

  const fetchPaiement = async () => {
    try {
      const res = await fetchWithAuth(`/api/paiements/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Paiement non trouvé');
        } else {
          throw new Error('Erreur chargement');
        }
      }
      const data = await res.json();
      setPaiement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deletePaiement = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce paiement ?')) return;

    try {
      const res = await fetchWithAuth(`/api/paiements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Paiement supprimé avec succès');
      router.push('/paiements');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement du paiement...</div>
        </div>
      </Layout>
    );
  }

  if (!paiement) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Paiement non trouvé</h2>
          <button
            onClick={() => router.push('/paiements')}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Retour à la liste
          </button>
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
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Détail du paiement</h1>
          <div className="flex gap-4">
            <button
              onClick={deletePaiement}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Supprimer ce paiement
            </button>
            <button
              onClick={() => router.push('/paiements')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Retour à la liste
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-10">
          {/* Infos stagiaire */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Stagiaire</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nom complet</p>
                <p className="text-xl font-medium">
                  {paiement.stagiaire?.prenom} {paiement.stagiaire?.nom}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-xl font-medium">{paiement.stagiaire?.email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Infos paiement */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Détails du paiement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant</p>
                <p className="text-3xl font-bold text-green-700">
                  {paiement.montant.toLocaleString('fr-TN')} DT
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Date du paiement</p>
                <p className="text-xl font-medium">
                  {new Date(paiement.datePaiement).toLocaleDateString('fr-TN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Mode de paiement</p>
                <span className="inline-block px-5 py-2 rounded-full text-lg font-semibold bg-blue-100 text-blue-800">
                  {paiement.modePaiement}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <span className={`inline-block px-5 py-2 rounded-full text-lg font-semibold ${
                  paiement.typePaiement === 'livre'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {paiement.typePaiement === 'livre' ? 'Livre' : 'Inscription'}
                </span>
              </div>

              {paiement.reference && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Référence</p>
                  <p className="text-xl font-medium">{paiement.reference}</p>
                </div>
              )}

              {paiement.remarques && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-600 mb-1">Remarques</p>
                  <p className="text-lg text-gray-800 whitespace-pre-line border-l-4 border-gray-300 pl-4">
                    {paiement.remarques}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Livres associés si type=livre */}
          {paiement.typePaiement === 'livre' && paiement.livresStagiaires?.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Livres associés</h2>
              <div className="space-y-3">
                {paiement.livresStagiaires.map((ls) => (
                  <div key={ls.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{ls.livre.nom}</p>
                      <p className="text-sm text-gray-500">{ls.livre.formation?.nom || '-'}</p>
                    </div>
                    <p className="font-semibold text-green-700">{ls.prixUnitaire.toLocaleString('fr-TN')} DT</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}