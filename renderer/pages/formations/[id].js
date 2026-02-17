import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function FormationDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [formation, setFormation] = useState(null);
  const [livres, setLivres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchFormation();
  }, [id]);

  const fetchFormation = async () => {
    try {
      const [resFormation, resLivres] = await Promise.all([
        fetchWithAuth(`/api/formations/${id}`),
        fetchWithAuth(`/api/livres?formationId=${id}`),
      ]);
      if (!resFormation.ok) {
        const err = await resFormation.json();
        throw new Error(err.error || 'Erreur chargement');
      }
      const data = await resFormation.json();
      setFormation(data);
      if (resLivres.ok) {
        setLivres(await resLivres.json());
      }
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFormation = async () => {
    if (!confirm('Supprimer cette formation ? Cette action est irréversible.')) return;

    try {
      const res = await fetchWithAuth(`/api/formations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec suppression');
      }
      toast.success('Formation supprimée');
      router.push('/formations');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getFormationTitle = (formation) => {
    let title = formation.nom;
    
    if (formation.niveau && formation.niveau !== 'debutant' && formation.niveau !== 'tout_niveau') {
      title += ` - Niveau ${formation.niveau}`;
    }
    
    if (formation.niveauDetail) {
      title += ` (${formation.niveauDetail.toUpperCase()})`;
    }
    
    if (formation.typePublic && formation.typePublic !== 'tout_public') {
      title += ` - ${formation.typePublic === 'kids' ? 'Enfants' : 'Adultes'}`;
    }
    
    return title;
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

  if (!formation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Formation non trouvée</h2>
          <Link href="/formations" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/formations" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux formations
      </Link>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {getFormationTitle(formation)}
            </h1>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                formation.categorie === 'langue' 
                  ? 'bg-blue-100 text-blue-800'
                  : formation.categorie === 'informatique'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {formation.categorie}
              </span>
              {formation.typePublic && formation.typePublic !== 'tout_public' && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {formation.typePublic === 'kids' ? 'Enfants' : 'Adultes'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href={`/formations/${id}/modifier`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Modifier
            </Link>
            <button
              onClick={deleteFormation}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
            >
              Supprimer
            </button>
          </div>
        </div>

        {/* Informations principales */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b">
            <div>
              <p className="text-sm text-gray-500">Niveau</p>
              <p className="font-medium">
                {formation.niveau}
                {formation.niveauDetail && (
                  <span className="text-sm text-gray-600 ml-1">
                    ({formation.niveauDetail.toUpperCase()})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Durée</p>
              <p className="font-medium">{formation.dureeHeures} heures</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix</p>
              <p className="font-medium">{formation.prix.toLocaleString('fr-TN')} TND</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span
                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                  formation.statut === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {formation.statut}
              </span>
            </div>
          </div>

          {formation.description && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{formation.description}</p>
            </div>
          )}

          {formation.objectifs && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-3">Objectifs</h2>
              <p className="text-gray-700 whitespace-pre-line">{formation.objectifs}</p>
            </div>
          )}

          {formation.prerequis && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-3">Prérequis</h2>
              <p className="text-gray-700 whitespace-pre-line">{formation.prerequis}</p>
            </div>
          )}

          {formation.certificat && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-3">Certificat</h2>
              <p className="text-gray-700">{formation.certificat}</p>
            </div>
          )}

          {formation.stats && (
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formation.stats.totalSessions}</p>
                <p className="text-sm text-gray-600">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formation.stats.sessionsEnCours}</p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{formation.stats.totalInscrits}</p>
                <p className="text-sm text-gray-600">Inscrits</p>
              </div>
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Sessions associées</h2>
          </div>
          {formation.sessions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formation.sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{s.nom}</td>
                      <td className="px-6 py-4">{s.formateur ? `${s.formateur.prenom} ${s.formateur.nom}` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(s.dateDebut).toLocaleDateString('fr-FR')} → {new Date(s.dateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-center">{s._count.inscriptions}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            s.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                            s.statut === 'terminee' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {s.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">Aucune session pour cette formation</div>
          )}
        </div>

        {/* Livres */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Livres associés</h2>
            {livres.length < 2 && (
              <Link
                href={`/livres/nouveau?formationId=${id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Ajouter un livre
              </Link>
            )}
          </div>
          {livres.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {livres.map((livre) => (
                  <div key={livre.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{livre.nom}</h3>
                        <div className="flex gap-3 mt-1">
                          <p className="text-sm text-gray-500">
                            {livre.prix.toLocaleString('fr-TN')} TND
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            livre.quantite > 5
                              ? 'bg-green-100 text-green-800'
                              : livre.quantite > 0
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Stock: {livre.quantite}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/livres/${livre.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {livres.length >= 2 && (
                <p className="text-xs text-gray-400 mt-3">Maximum de 2 livres atteint</p>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">Aucun livre pour cette formation</div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/formations" className="text-blue-600 hover:underline">
            ← Retour à la liste des formations
          </Link>
        </div>
      </div>
    </Layout>
  );
}