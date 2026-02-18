import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Salles() {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchSalles();
  }, [filterType, filterStatut]);

  const fetchSalles = async () => {
    try {
      let url = '/api/salles';
      const params = new URLSearchParams();
      
      if (filterType) params.append('type', filterType);
      if (filterStatut) params.append('statut', filterStatut);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setSalles(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des salles');
      setLoading(false);
    }
  };

  const deleteSalle = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette salle ?')) return;

    try {
      const res = await fetchWithAuth(`/api/salles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Échec suppression');
      }
      
      toast.success('Salle supprimée');
      fetchSalles();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const filteredSalles = salles.filter(
    (s) =>
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batiment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.equipements?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des salles...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Salles</h1>
          <Link
            href="/salles/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Salle
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par nom, bâtiment, équipements..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500 min-w-[160px]"
              >
                <option value="">Tous les types</option>
                <option value="cours">Cours</option>
                <option value="informatique">Informatique</option>
                <option value="conference">Conférence</option>
                <option value="atelier">Atelier</option>
              </select>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500 min-w-[160px]"
              >
                <option value="">Tous les statuts</option>
                <option value="disponible">Disponible</option>
                <option value="maintenance">En maintenance</option>
                <option value="indisponible">Indisponible</option>
              </select>
              {(filterType || filterStatut || searchTerm) && (
                <button
                  onClick={() => { setFilterType(''); setFilterStatut(''); setSearchTerm(''); }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Table desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bâtiment / Étage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Équipements</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Aucune salle trouvée</td>
                  </tr>
                ) : (
                  filteredSalles.map((salle) => (
                    <tr key={salle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{salle.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salle.batiment || '-'} {salle.etage ? `/ ${salle.etage}` : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salle.capacite} places</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{salle.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{salle.equipements || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          salle.statut === 'disponible' ? 'bg-green-100 text-green-800'
                            : salle.statut === 'maintenance' ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>{salle.statut}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/salles/${salle.id}`} className="text-blue-600 hover:text-blue-900 mr-4">Voir</Link>
                        <Link href={`/salles/${salle.id}/modifier`} className="text-green-600 hover:text-green-900 mr-4">Modifier</Link>
                        <button onClick={() => deleteSalle(salle.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredSalles.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">Aucune salle trouvée</div>
            ) : (
              filteredSalles.map((salle) => (
                <div key={salle.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{salle.nom}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      salle.statut === 'disponible' ? 'bg-green-100 text-green-800'
                        : salle.statut === 'maintenance' ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>{salle.statut}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {salle.capacite} places · <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{salle.type}</span>
                  </div>
                  {salle.batiment && <div className="text-sm text-gray-500">{salle.batiment} {salle.etage ? `/ ${salle.etage}` : ''}</div>}
                  <div className="flex justify-end gap-4 pt-2 border-t text-sm font-medium">
                    <Link href={`/salles/${salle.id}`} className="text-blue-600 hover:text-blue-900">Voir</Link>
                    <Link href={`/salles/${salle.id}/modifier`} className="text-green-600 hover:text-green-900">Modifier</Link>
                    <button onClick={() => deleteSalle(salle.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
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