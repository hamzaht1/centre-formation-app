import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [filterStatut]);

  const fetchSessions = async () => {
    try {
      let url = '/api/sessions';
      if (filterStatut) {
        url += `?statut=${filterStatut}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      try {
        const res = await fetchWithAuth(`/api/sessions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Session supprimée avec succès');
          fetchSessions();
        } else {
          const error = await res.json();
          toast.error(error.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
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

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Gestion des Sessions
          </h1>
          <Link
            href="/sessions/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Session
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
              <p className="text-sm text-gray-500">Total sessions</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-cyan-50">
              <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-600">{sessions.filter(s => s.statut === 'a_venir').length}</p>
              <p className="text-sm text-gray-500">{"À venir"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.statut === 'en_cours').length}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-gray-100">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{sessions.filter(s => s.statut === 'terminee').length}</p>
              <p className="text-sm text-gray-500">{"Terminées"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded ${
                  filterStatut === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterStatut('a_venir')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'a_venir'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                À venir
              </button>
              <button
                onClick={() => setFilterStatut('en_cours')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'en_cours'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                En cours
              </button>
              <button
                onClick={() => setFilterStatut('terminee')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'terminee'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Terminées
              </button>
              <button
                onClick={() => setFilterStatut('annulee')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'annulee'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Annulées
              </button>
            </div>
          </div>

          {/* Table desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date début</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date fin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Aucune session trouvée</td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{session.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.formation.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(session.dateDebut), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(session.dateFin), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.formateur ? `${session.formateur.nom} ${session.formateur.prenom}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session._count?.inscriptions || 0}/{session.capaciteMax}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.statut === 'a_venir' ? 'bg-blue-100 text-blue-800'
                            : session.statut === 'en_cours' ? 'bg-green-100 text-green-800'
                            : session.statut === 'terminee' ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.statut.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/sessions/${session.id}`} className="text-blue-600 hover:text-blue-900 mr-4">Voir</Link>
                        <Link href={`/sessions/${session.id}/modifier`} className="text-green-600 hover:text-green-900 mr-4">Modifier</Link>
                        <button onClick={() => deleteSession(session.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">Aucune session trouvée</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900">{session.nom}</span>
                    <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                      session.statut === 'a_venir' ? 'bg-blue-100 text-blue-800'
                        : session.statut === 'en_cours' ? 'bg-green-100 text-green-800'
                        : session.statut === 'terminee' ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {session.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{session.formation.nom}</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(session.dateDebut), 'dd/MM/yyyy')} - {format(new Date(session.dateFin), 'dd/MM/yyyy')} · {session._count?.inscriptions || 0}/{session.capaciteMax} inscrits
                  </div>
                  <div className="flex justify-end gap-4 pt-2 border-t text-sm font-medium">
                    <Link href={`/sessions/${session.id}`} className="text-blue-600 hover:text-blue-900">Voir</Link>
                    <Link href={`/sessions/${session.id}/modifier`} className="text-green-600 hover:text-green-900">Modifier</Link>
                    <button onClick={() => deleteSession(session.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}