import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function LivreDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [livre, setLivre] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchLivre();
  }, [id]);

  const fetchLivre = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/livres/${id}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setLivre(data);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les informations du livre');
    } finally {
      setLoading(false);
    }
  };

  const deleteLivre = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce livre ? Cette action est irréversible.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/livres/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec suppression');
      }

      toast.success('Livre supprimé avec succès');
      router.push('/livres');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement du livre...</div>
        </div>
      </Layout>
    );
  }

  if (!livre) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Livre non trouvé</h2>
          <Link href="/livres" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{livre.nom}</h1>
          <div className="flex gap-4">
            <Link
              href={`/livres/${id}/modifier`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Modifier
            </Link>
            <button
              onClick={deleteLivre}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informations du livre</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-lg">{livre.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prix</p>
                <p className="font-medium text-lg">{livre.prix.toLocaleString('fr-TN')} TND</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  livre.quantite > 5
                    ? 'bg-green-100 text-green-800'
                    : livre.quantite > 0
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {livre.quantite} exemplaire{livre.quantite !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Formation</p>
                <Link
                  href={`/formations/${livre.formationId}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {livre.formation?.nom || '-'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Attributions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Attributions ({livre.livresStagiaires?.length || 0})</h2>
          </div>
          {livre.livresStagiaires?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stagiaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date attribution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {livre.livresStagiaires.map((ls) => (
                    <tr key={ls.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/stagiaires/${ls.stagiaireId}`} className="text-blue-600 hover:underline">
                          {ls.stagiaire.prenom} {ls.stagiaire.nom}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(ls.dateAttribution).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ls.prixUnitaire.toLocaleString('fr-TN')} TND
                      </td>
                      <td className="px-6 py-4">
                        {ls.paiement ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paye
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Non paye
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">Aucune attribution pour ce livre</div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/livres" className="text-blue-600 hover:underline">
            ← Retour à la liste des livres
          </Link>
        </div>
      </div>
    </Layout>
  );
}
