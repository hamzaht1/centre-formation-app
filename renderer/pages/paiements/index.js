import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStagiaire, setFilterStagiaire] = useState('');
  const [filterType, setFilterType] = useState('');

  // Pour le filtre stagiaire
  const [stagiaires, setStagiaires] = useState([]);

  useEffect(() => {
    fetchStagiaires();
    fetchPaiements();
  }, [filterStagiaire, filterType]);

  const fetchStagiaires = async () => {
    try {
      const res = await fetchWithAuth('/api/stagiaires?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setStagiaires(data.data || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaiements = async () => {
    try {
      setLoading(true);
      let url = '/api/paiements';
      const params = new URLSearchParams();
      if (filterStagiaire) params.append('stagiaireId', filterStagiaire);
      if (filterType) params.append('typePaiement', filterType);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setPaiements(data.data || data);
    } catch (error) {
      toast.error('Erreur lors du chargement des paiements');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deletePaiement = async (id) => {
    if (!confirm('Supprimer ce paiement ? Cette action est irréversible.')) return;

    try {
      const res = await fetchWithAuth(`/api/paiements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Paiement supprimé avec succès');
      fetchPaiements();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPaiements = paiements.filter((p) =>
    searchTerm
      ? `${p.stagiaire?.nom || ''} ${p.stagiaire?.prenom || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        p.modePaiement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des paiements...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Paiements</h1>
          <Link
            href="/paiements/nouveau"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enregistrer un paiement
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{paiements.length}</p>
              <p className="text-sm text-gray-500">Total paiements</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{paiements.reduce((s, p) => s + (p.montant || 0), 0).toLocaleString('fr-TN')} DT</p>
              <p className="text-sm text-gray-500">Montant total</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-50">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{paiements.filter(p => p.typePaiement === 'inscription').length}</p>
              <p className="text-sm text-gray-500">Inscriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Rechercher par stagiaire, mode ou référence..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                value={filterStagiaire}
                onChange={(e) => setFilterStagiaire(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white min-w-[240px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Tous les stagiaires</option>
                {stagiaires.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prenom} {s.nom}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Tous les types</option>
                <option value="inscription">Inscription</option>
                <option value="livre">Livre</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Stagiaire
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPaiements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                ) : (
                  filteredPaiements.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {p.stagiaire?.prenom} {p.stagiaire?.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          p.typePaiement === 'livre'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {p.typePaiement === 'livre' ? 'Livre' : 'Inscription'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {p.montant.toLocaleString('fr-TN')} DT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {new Date(p.datePaiement).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {p.modePaiement}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {p.reference || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/paiements/${p.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Voir
                        </Link>
                        <button
                          onClick={() => deletePaiement(p.id)}
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