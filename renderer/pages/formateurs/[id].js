import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function FormateurDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [formateur, setFormateur] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchFormateur();
    fetchDisponibilites();
  }, [id]);

  const fetchFormateur = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/formateurs/${id}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setFormateur(data);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les informations du formateur');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilites = async () => {
    try {
      const res = await fetchWithAuth(`/api/disponibilites?formateurId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDisponibilites(data);
      }
    } catch (err) {
      console.error('Erreur chargement disponibilités:', err);
    }
  };

  const deleteFormateur = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce formateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/formateurs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Formateur supprimé avec succès');
      router.push('/formateurs');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const getJourLabel = (jourValue) => {
    const joursMap = {
      0: 'Dimanche',
      1: 'Lundi',
      2: 'Mardi',
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi'
    };
    return joursMap[jourValue] || '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement du formateur...</div>
        </div>
      </Layout>
    );
  }

  if (!formateur) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Formateur non trouvé</h2>
          <Link href="/formateurs" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/formateurs" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux formateurs
      </Link>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {formateur.prenom} {formateur.nom}
          </h1>
          <div className="flex gap-4">
            <Link
              href={`/formateurs/${id}/modifier`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Modifier
            </Link>
            <button
              onClick={deleteFormateur}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{formateur.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium">{formateur.telephone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    formateur.statut === 'actif'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {formateur.statut}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Spécialités</p>
                <p className="font-medium">{formateur.specialites || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expérience</p>
                <p className="font-medium">{formateur.experience || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d'embauche</p>
                <p className="font-medium">
                  {formateur.dateEmbauche
                    ? new Date(formateur.dateEmbauche).toLocaleDateString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disponibilités hebdomadaires */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Disponibilités hebdomadaires</h2>
          </div>

          <div className="p-6">
            {disponibilites && disponibilites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disponibilites
                  .filter(d => d.actif)
                  .sort((a, b) => a.jourSemaine - b.jourSemaine || a.heureDebut.localeCompare(b.heureDebut))
                  .map((dispo) => (
                    <div key={dispo.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-900">
                        {getJourLabel(dispo.jourSemaine)}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        {dispo.heureDebut} - {dispo.heureFin}
                      </div>
                      <div className="text-xs text-blue-600 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100">
                          {dispo.typeRecurrence}
                        </span>
                      </div>
                      {dispo.remarques && (
                        <div className="text-xs text-blue-600 mt-2 italic">
                          {dispo.remarques}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Aucune disponibilité enregistrée
              </p>
            )}
          </div>
        </div>

        {/* Sessions enseignées */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Sessions enseignées</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom de la session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Formation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      Aucune session enregistrée pour ce formateur
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {session.nom}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {session.formation?.nom || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.dateDebut).toLocaleDateString('fr-FR')} →{' '}
                        {new Date(session.dateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            session.statut === 'en_cours'
                              ? 'bg-green-100 text-green-800'
                              : session.statut === 'terminee'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {session.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/formateurs" className="text-blue-600 hover:underline">
            ← Retour à la liste des formateurs
          </Link>
        </div>
      </div>
    </Layout>
  );
}