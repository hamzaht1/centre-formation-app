import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Formations() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterTypePublic, setFilterTypePublic] = useState('');

  useEffect(() => {
    fetchFormations();
  }, [filterStatut, filterCategorie, filterTypePublic]);

  const fetchFormations = async () => {
    try {
      let url = '/api/formations';
      const params = new URLSearchParams();
      if (filterStatut) params.append('statut', filterStatut);
      if (filterCategorie) params.append('categorie', filterCategorie);
      if (filterTypePublic) params.append('typePublic', filterTypePublic);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setFormations(data.data || data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  const deleteFormation = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette formation ?')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/formations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec suppression');
      }
      toast.success('Formation supprimée');
      fetchFormations();
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    }
  };

  const filteredFormations = formations.filter(f =>
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.niveau || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper par catégorie pour affichage organisé
  const formationsGroupees = filteredFormations.reduce((acc, f) => {
    const cat = f.categorie || 'autre';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const getFormationLabel = (formation) => {
    let label = formation.nom;
    
    if (formation.niveau && formation.niveau !== 'debutant' && formation.niveau !== 'tout_niveau') {
      label += ` - ${formation.niveau}`;
    }
    
    if (formation.niveauDetail) {
      label += ` (${formation.niveauDetail.toUpperCase()})`;
    }
    
    if (formation.typePublic && formation.typePublic !== 'tout_public') {
      label += ` - ${formation.typePublic === 'kids' ? 'Enfants' : 'Adultes'}`;
    }
    
    return label;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des formations...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Formations</h1>
          <Link
            href="/formations/nouveau"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Formation
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formations.length}</p>
              <p className="text-sm text-gray-500">Total formations</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formations.filter(f => f.statut === 'active').length}</p>
              <p className="text-sm text-gray-500">Actives</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-50">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{formations.length ? Math.round(formations.reduce((s, f) => s + (f.prix || 0), 0) / formations.length).toLocaleString('fr-TN') : 0} TND</p>
              <p className="text-sm text-gray-500">Prix moyen</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <input
              type="text"
              placeholder="Rechercher par nom, description, niveau..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
                <select
                  value={filterCategorie}
                  onChange={(e) => setFilterCategorie(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Toutes les catégories</option>
                  <option value="langue">Langues</option>
                  <option value="informatique">Informatique</option>
                  <option value="autre">Autres</option>
                </select>
              </div>

              <div className="min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Public</label>
                <select
                  value={filterTypePublic}
                  onChange={(e) => setFilterTypePublic(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tout public</option>
                  <option value="kids">Enfants</option>
                  <option value="adultes">Adultes</option>
                </select>
              </div>

              <div className="min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tous ({formations.length})</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Inactives</option>
                </select>
              </div>

              {(filterCategorie || filterTypePublic || filterStatut || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterCategorie('');
                    setFilterTypePublic('');
                    setFilterStatut('');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg border transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Table desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFormations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                      Aucune formation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredFormations.map((formation) => (
                    <tr key={formation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {getFormationLabel(formation)}
                        </div>
                        {formation.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {formation.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          formation.categorie === 'langue'
                            ? 'bg-blue-100 text-blue-800'
                            : formation.categorie === 'informatique'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {formation.categorie}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formation.niveau}
                        {formation.niveauDetail && (
                          <div className="text-xs text-gray-500">
                            {formation.niveauDetail.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formation.typePublic === 'kids'
                          ? 'Enfants'
                          : formation.typePublic === 'adultes'
                          ? 'Adultes'
                          : 'Tout public'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formation.dureeHeures} h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formation.prix.toLocaleString('fr-TN')} TND
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {formation._count?.sessions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            formation.statut === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {formation.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/formations/${formation.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Voir
                        </Link>
                        <Link href={`/formations/${formation.id}/modifier`} className="text-green-600 hover:text-green-900 mr-4">
                          Modifier
                        </Link>
                        <button
                          onClick={() => deleteFormation(formation.id)}
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

          {/* Cartes mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredFormations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">Aucune formation trouvée</div>
            ) : (
              filteredFormations.map((formation) => (
                <div key={formation.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900">{getFormationLabel(formation)}</span>
                    <span
                      className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                        formation.statut === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {formation.statut}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      formation.categorie === 'langue'
                        ? 'bg-blue-100 text-blue-800'
                        : formation.categorie === 'informatique'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {formation.categorie}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formation.prix.toLocaleString('fr-TN')} TND · {formation.dureeHeures}h · {formation._count?.sessions || 0} sessions
                  </div>
                  <div className="flex justify-end gap-4 pt-2 border-t text-sm font-medium">
                    <Link href={`/formations/${formation.id}`} className="text-blue-600 hover:text-blue-900">Voir</Link>
                    <Link href={`/formations/${formation.id}/modifier`} className="text-green-600 hover:text-green-900">Modifier</Link>
                    <button onClick={() => deleteFormation(formation.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
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