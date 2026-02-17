import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function SessionPresences() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState(null);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [resSession, resPresences] = await Promise.all([
        fetchWithAuth(`/api/sessions/${id}`),
        fetchWithAuth(`/api/presences?sessionId=${id}`),
      ]);

      if (!resSession.ok || !resPresences.ok) throw new Error('Erreur chargement');

      setSession(await resSession.json());
      const presData = await resPresences.json();
      setPresences(presData.data || presData);
    } catch (err) {
      toast.error('Impossible de charger les données');
      console.error(err);
    } finally {
      setLoading(false);
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

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Session non trouvée</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Présences — {session.nom}
          </h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline font-medium"
          >
            ← Retour à la session
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">
              Liste des présences ({presences.length})
            </h2>
          </div>

          {presences.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Aucune présence enregistrée pour cette session
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                      Stagiaire
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                      Remarques
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {presences.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {p.stagiaire?.prenom} {p.stagiaire?.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {new Date(p.date).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            p.statut === 'present'
                              ? 'bg-green-100 text-green-800'
                              : p.statut === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : p.statut === 'retard'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {p.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{p.remarques || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={() => router.push(`/presences/bulk?sessionId=${id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-medium shadow-md"
          >
            Marquer les présences pour une date
          </button>
        </div>
      </div>
    </Layout>
  );
}