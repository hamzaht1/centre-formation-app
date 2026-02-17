import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Livres() {
  const [livres, setLivres] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormation, setFilterFormation] = useState('');

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    fetchLivres();
  }, [filterFormation]);

  const fetchFormations = async () => {
    try {
      const res = await fetchWithAuth('/api/formations?statut=active&limit=1000');
      if (res.ok) {
        const data = await res.json();
        setFormations(data.data || data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLivres = async () => {
    try {
      let url = '/api/livres';
      const params = new URLSearchParams();

      if (filterFormation) params.append('formationId', filterFormation);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setLivres(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des livres');
      setLoading(false);
    }
  };

  const deleteLivre = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce livre ?')) return;

    try {
      const res = await fetchWithAuth(`/api/livres/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec suppression');
      }

      toast.success('Livre supprimé');
      fetchLivres();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const filteredLivres = livres.filter(
    (l) =>
      l.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.formation?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des livres...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Livres</h1>
          <Link
            href="/livres/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouveau Livre
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{livres.length}</p>
              <p className="text-sm text-gray-500">Total livres</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{livres.filter(l => l.quantite > 0).length}</p>
              <p className="text-sm text-gray-500">En stock</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-red-50">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{livres.filter(l => l.quantite === 0).length}</p>
              <p className="text-sm text-gray-500">Rupture de stock</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-50">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{livres.reduce((s, l) => s + (l.prix || 0) * (l.quantite || 0), 0).toLocaleString('fr-TN')} TND</p>
              <p className="text-sm text-gray-500">Valeur du stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <input
              type="text"
              placeholder="Rechercher par nom du livre ou formation..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-600">Formation :</label>
              <select
                value={filterFormation}
                onChange={(e) => setFilterFormation(e.target.value)}
                className="border rounded px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Toutes les formations</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Formation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLivres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Aucun livre trouvé
                    </td>
                  </tr>
                ) : (
                  filteredLivres.map((livre) => (
                    <tr key={livre.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{livre.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {livre.prix.toLocaleString('fr-TN')} TND
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          livre.quantite > 5
                            ? 'bg-green-100 text-green-800'
                            : livre.quantite > 0
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {livre.quantite}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {livre.formation?.nom || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/livres/${livre.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Voir
                        </Link>
                        <Link
                          href={`/livres/${livre.id}/modifier`}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => deleteLivre(livre.id)}
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
