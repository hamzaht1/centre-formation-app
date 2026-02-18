import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Inscriptions() {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchInscriptions();
  }, [filterStatut]);

  const fetchInscriptions = async () => {
    try {
      let url = '/api/inscriptions';
      if (filterStatut) {
        url += `?statut=${filterStatut}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setInscriptions(data.data || data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des inscriptions');
    } finally {
      setLoading(false);
    }
  };

  const deleteInscription = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette inscription ?')) return;

    try {
      const res = await fetchWithAuth(`/api/inscriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Inscription supprimée');
      fetchInscriptions();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const filteredInscriptions = inscriptions.filter((i) =>
    `${i.stagiaire?.nom || ''} ${i.stagiaire?.prenom || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    i.session?.formation?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.session?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des inscriptions...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Inscriptions</h1>
          <Link
            href="/inscriptions/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Inscription
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{inscriptions.length}</p>
              <p className="text-sm text-gray-500">Total inscriptions</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{inscriptions.filter(i => i.statut === 'en_cours').length}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-cyan-50">
              <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-600">{inscriptions.filter(i => i.statut === 'terminee').length}</p>
              <p className="text-sm text-gray-500">{"Terminées"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-red-50">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{inscriptions.filter(i => i.statut === 'abandonnee').length}</p>
              <p className="text-sm text-gray-500">{"Abandonnées"}</p>
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

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded ${
                  filterStatut === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Tous ({inscriptions.length})
              </button>
              <button
                onClick={() => setFilterStatut('en_cours')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'en_cours' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                En cours
              </button>
              <button
                onClick={() => setFilterStatut('terminee')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'terminee' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Terminée
              </button>
              <button
                onClick={() => setFilterStatut('abandonnee')}
                className={`px-4 py-2 rounded ${
                  filterStatut === 'abandonnee' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Abandonnée
              </button>
            </div>
          </div>

          {/* Table desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stagiaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formation / Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date inscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Aucune inscription trouvée</td>
                  </tr>
                ) : (
                  filteredInscriptions.map((inscription) => (
                    <tr key={inscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{inscription.stagiaire?.prenom} {inscription.stagiaire?.nom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{inscription.session?.formation?.nom || '—'}</div>
                        <div className="text-sm text-gray-600">{inscription.session?.nom || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(inscription.dateInscription).toLocaleDateString('fr-TN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{inscription.montantTotal?.toLocaleString('fr-TN')} TND</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{inscription.montantPaye?.toLocaleString('fr-TN') || '0'} TND</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          inscription.statut === 'en_cours' ? 'bg-green-100 text-green-800'
                            : inscription.statut === 'terminee' ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>{inscription.statut}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/inscriptions/${inscription.id}`} className="text-blue-600 hover:text-blue-900 mr-4">Voir</Link>
                        <Link href={`/inscriptions/${inscription.id}/modifier`} className="text-green-600 hover:text-green-900 mr-4">Modifier</Link>
                        <button onClick={() => deleteInscription(inscription.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredInscriptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">Aucune inscription trouvée</div>
            ) : (
              filteredInscriptions.map((inscription) => (
                <div key={inscription.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900">{inscription.stagiaire?.prenom} {inscription.stagiaire?.nom}</span>
                    <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                      inscription.statut === 'en_cours' ? 'bg-green-100 text-green-800'
                        : inscription.statut === 'terminee' ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>{inscription.statut}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {inscription.session?.formation?.nom || '—'} · {inscription.session?.nom || '—'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {inscription.montantTotal?.toLocaleString('fr-TN')} TND · Payé: {inscription.montantPaye?.toLocaleString('fr-TN') || '0'} TND
                  </div>
                  <div className="flex justify-end gap-4 pt-2 border-t text-sm font-medium">
                    <Link href={`/inscriptions/${inscription.id}`} className="text-blue-600 hover:text-blue-900">Voir</Link>
                    <Link href={`/inscriptions/${inscription.id}/modifier`} className="text-green-600 hover:text-green-900">Modifier</Link>
                    <button onClick={() => deleteInscription(inscription.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
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