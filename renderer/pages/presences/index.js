import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Presences() {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterSession, setFilterSession] = useState('');

  // Pour filtres select
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
    fetchPresences();
  }, [filterStatut, filterSession]);

  const fetchSessions = async () => {
    try {
      const res = await fetchWithAuth('/api/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPresences = async () => {
    try {
      setLoading(true);
      let url = '/api/presences';
      const params = new URLSearchParams();
      if (filterStatut) params.append('statut', filterStatut);
      if (filterSession) params.append('sessionId', filterSession);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setPresences(data.data || data);
    } catch (error) {
      toast.error('Erreur lors du chargement des présences');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deletePresence = async (id) => {
    if (!confirm('Supprimer cette présence ?')) return;

    try {
      const res = await fetchWithAuth(`/api/presences/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Présence supprimée');
      fetchPresences();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPresences = presences.filter((p) =>
    searchTerm
      ? `${p.stagiaire?.nom || ''} ${p.stagiaire?.prenom || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        p.session?.formation?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.session?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des présences...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Présences</h1>
          <div className="flex gap-3">
            <Link
              href="/presences/nouveau"
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              + Présence manuelle
            </Link>
            <Link
              href="/presences/bulk"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Marquage massif
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{presences.length}</p>
              <p className="text-sm text-gray-500">{"Total présences"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{presences.filter(p => p.statut === 'present').length}</p>
              <p className="text-sm text-gray-500">{"Présents"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-red-50">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{presences.filter(p => p.statut === 'absent').length}</p>
              <p className="text-sm text-gray-500">Absents</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-yellow-50">
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{presences.filter(p => p.statut === 'retard').length}</p>
              <p className="text-sm text-gray-500">Retards</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <input
              type="text"
              placeholder="Rechercher par stagiaire, formation ou session..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex flex-wrap gap-3">
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="border rounded px-4 py-2 bg-white min-w-[240px]"
              >
                <option value="">Toutes les sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.formation?.nom} — {s.nom}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded ${
                  filterStatut === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Tous ({presences.length})
              </button>
              <button
                onClick={() => setFilterStatut('present')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Présent
              </button>
              <button
                onClick={() => setFilterStatut('absent')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => setFilterStatut('retard')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'retard' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Retard
              </button>
              <button
                onClick={() => setFilterStatut('justifie')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'justifie' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Justifié
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stagiaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Session / Formation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Remarques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPresences.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Aucune présence trouvée
                    </td>
                  </tr>
                ) : (
                  filteredPresences.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {p.stagiaire?.prenom} {p.stagiaire?.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{p.session?.formation?.nom || '—'}</div>
                        <div className="text-sm text-gray-600">{p.session?.nom || '—'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/presences/${p.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Voir
                        </Link>
                        <Link href={`/presences/${p.id}`} className="text-green-600 hover:text-green-900 mr-4">
                          Modifier
                        </Link>
                        <button
                          onClick={() => deletePresence(p.id)}
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