import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Formateurs() {
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchFormateurs();
  }, [filterStatut]);

  const fetchFormateurs = async () => {
    try {
      let url = '/api/formateurs';
      if (filterStatut) {
        url += `?statut=${filterStatut}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setFormateurs(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des formateurs');
      setLoading(false);
    }
  };

  const deleteFormateur = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce formateur ?')) return;

    try {
      const res = await fetchWithAuth(`/api/formateurs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Formateur supprimé');
      fetchFormateurs();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredFormateurs = formateurs.filter(
    (f) =>
      `${f.nom} ${f.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.specialites?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des formateurs...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Formateurs</h1>
          <Link
            href="/formateurs/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouveau Formateur
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formateurs.length}</p>
              <p className="text-sm text-gray-500">Total formateurs</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formateurs.filter(f => f.statut === 'actif').length}</p>
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
              <p className="text-2xl font-bold text-red-500">{formateurs.filter(f => f.statut !== 'actif').length}</p>
              <p className="text-sm text-gray-500">Inactifs</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-50">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{formateurs.reduce((s, f) => s + (f._count?.sessions || 0), 0)}</p>
              <p className="text-sm text-gray-500">Sessions totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <input
              type="text"
              placeholder="Rechercher par nom, pr\u00e9nom, email, sp\u00e9cialit\u00e9..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded ${
                  filterStatut === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Tous ({formateurs.length})
              </button>
              <button
                onClick={() => setFilterStatut('actif')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'actif' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFilterStatut('inactif')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'inactif' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Inactifs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Spécialités
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sessions
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
                {filteredFormateurs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Aucun formateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredFormateurs.map((formateur) => (
                    <tr key={formateur.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formateur.prenom} {formateur.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formateur.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formateur.specialites || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formateur._count?.sessions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            formateur.statut === 'actif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {formateur.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/formateurs/${formateur.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Voir
                        </Link>
                        <Link
                          href={`/formateurs/${formateur.id}/modifier`}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => deleteFormateur(formateur.id)}
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