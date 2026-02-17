import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Stagiaires() {
  const [stagiaires, setStagiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchStagiaires();
  }, [filterStatut]);

  const fetchStagiaires = async () => {
    try {
      let url = '/api/stagiaires';
      if (filterStatut) {
        url += `?statut=${filterStatut}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setStagiaires(data.data || data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des stagiaires');
      setLoading(false);
    }
  };

  const deleteStagiaire = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ?')) {
      try {
        await fetchWithAuth(`/api/stagiaires/${id}`, { method: 'DELETE' });
        toast.success('Stagiaire supprimé avec succès');
        fetchStagiaires();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredStagiaires = stagiaires.filter(
    (stagiaire) =>
      stagiaire.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stagiaire.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stagiaire.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stagiaire.telephone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Gestion des Stagiaires
          </h1>
          <Link
            href="/stagiaires/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouveau Stagiaire
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stagiaires.length}</p>
              <p className="text-sm text-gray-500">Total stagiaires</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stagiaires.filter(s => s.statut === 'actif').length}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-red-50">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stagiaires.filter(s => s.statut === 'inactif').length}</p>
              <p className="text-sm text-gray-500">Inactifs</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-purple-50">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stagiaires.filter(s => s.statut === 'diplome').length}</p>
              <p className="text-sm text-gray-500">{"Diplôm\u00e9s"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <input
              type="text"
              placeholder="Rechercher un stagiaire..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded ${
                  filterStatut === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Tous ({stagiaires.length})
              </button>
              <button
                onClick={() => setFilterStatut('actif')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'actif'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFilterStatut('inactif')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'inactif'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Inactifs
              </button>
              <button
                onClick={() => setFilterStatut('diplome')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'diplome'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Diplômés
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom Complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Inscriptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStagiaires.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Aucun stagiaire trouvé
                    </td>
                  </tr>
                ) : (
                  filteredStagiaires.map((stagiaire) => (
                    <tr key={stagiaire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {stagiaire.nom} {stagiaire.prenom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stagiaire.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stagiaire.telephone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stagiaire._count?.inscriptions || 0} inscriptions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            stagiaire.statut === 'actif'
                              ? 'bg-green-100 text-green-800'
                              : stagiaire.statut === 'diplome'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {stagiaire.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/stagiaires/${stagiaire.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Voir
                        </Link>
                        <Link
                          href={`/stagiaires/${stagiaire.id}/modifier`}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => deleteStagiaire(stagiaire.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}