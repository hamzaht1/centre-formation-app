import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import fetchWithAuth from '../../lib/fetchWithAuth';

const statutConfig = {
  a_venir: { label: 'À venir', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  en_cours: { label: 'En cours', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  terminee: { label: 'Terminée', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  annulee: { label: 'Annulée', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function DetailsSession() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await fetchWithAuth(`/api/sessions/${id}`);
      if (!res.ok) throw new Error('Erreur chargement session');
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-xl text-gray-700">Chargement...</span>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Session non trouvée</h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </Layout>
    );
  }

  const statut = statutConfig[session.statut] || statutConfig.a_venir;
  const totalPaye = session.inscriptions?.reduce((s, i) => s + (i.montantPaye || 0), 0) || 0;
  const totalDu = session.inscriptions?.reduce((s, i) => s + (i.montantTotal || 0), 0) || 0;
  const tauxPaiement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;
  const prochainePlanning = session.planning?.filter(
    (p) => new Date(p.date) >= new Date().setHours(0, 0, 0, 0)
  ).slice(0, 5) || [];

  return (
    <Layout>
      <Link href="/sessions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux sessions
      </Link>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{session.nom}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statut.bg} ${statut.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statut.dot}`}></span>
                  {statut.label}
                </span>
              </div>
              <p className="text-gray-500">
                {session.formation?.nom} — {format(new Date(session.dateDebut), 'dd MMM yyyy', { locale: fr })} au {format(new Date(session.dateFin), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/inscriptions/nouveau?sessionId=${id}`}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Inscrire
              </Link>
              <Link
                href={`/sessions/${id}/modifier`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Link>
              <Link
                href={`/sessions/${id}/planning`}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Planning
              </Link>
              <Link
                href={`/sessions/${id}/presences`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Présences
              </Link>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Capacité */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Inscrits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {session.stats?.nombreInscrits || 0}<span className="text-sm font-normal text-gray-400">/{session.capaciteMax}</span>
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all ${
                  (session.stats?.tauxRemplissage || 0) >= 90 ? 'bg-red-500' :
                  (session.stats?.tauxRemplissage || 0) >= 70 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(session.stats?.tauxRemplissage || 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{session.stats?.tauxRemplissage || 0}% rempli</p>
          </div>

          {/* Revenus */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Revenus</p>
                <p className="text-2xl font-bold text-gray-900">{totalPaye.toLocaleString('fr-TN')}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${tauxPaiement}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{tauxPaiement}% encaissé sur {totalDu.toLocaleString('fr-TN')} TND</p>
          </div>

          {/* Séances */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Séances</p>
                <p className="text-2xl font-bold text-gray-900">{session.stats?.nombreSeances || 0}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">programmées au planning</p>
          </div>

          {/* Formateur */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Formateur</p>
                <p className="text-lg font-bold text-gray-900">
                  {session.formateur ? `${session.formateur.prenom} ${session.formateur.nom}` : 'Non assigné'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {session.salle?.nom ? `Salle : ${session.salle.nom}` : 'Salle non définie'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos générales */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informations</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-gray-500">Formation</p>
                  <p className="font-medium">{session.formation?.nom}</p>
                </div>
                <div>
                  <p className="text-gray-500">Prix formation</p>
                  <p className="font-medium">{session.formation?.prix?.toLocaleString('fr-TN')} TND</p>
                </div>
                <div>
                  <p className="text-gray-500">Début</p>
                  <p className="font-medium">{format(new Date(session.dateDebut), 'EEEE dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fin</p>
                  <p className="font-medium">{format(new Date(session.dateFin), 'EEEE dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Horaires</p>
                  <p className="font-medium">{session.horaires || 'Non définis'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Durée totale</p>
                  <p className="font-medium">{session.formation?.dureeHeures}h</p>
                </div>
              </div>
            </div>

            {/* Stagiaires inscrits */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Stagiaires inscrits ({session.inscriptions?.length || 0})
                </h2>
                <Link
                  href={`/inscriptions/nouveau?sessionId=${id}`}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Ajouter
                </Link>
              </div>

              {session.inscriptions?.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>Aucun stagiaire inscrit</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 font-medium">Stagiaire</th>
                        <th className="pb-2 font-medium">Contact</th>
                        <th className="pb-2 font-medium">Paiement</th>
                        <th className="pb-2 font-medium text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {session.inscriptions?.map((insc) => {
                        const pct = insc.montantTotal > 0 ? Math.round((insc.montantPaye / insc.montantTotal) * 100) : 0;
                        const solde = insc.montantPaye >= insc.montantTotal;
                        return (
                          <tr key={insc.id} className="hover:bg-gray-50">
                            <td className="py-3">
                              <Link href={`/stagiaires/${insc.stagiaire.id}`} className="hover:text-blue-600">
                                <p className="font-medium text-gray-900">{insc.stagiaire.prenom} {insc.stagiaire.nom}</p>
                              </Link>
                            </td>
                            <td className="py-3 text-gray-500">
                              {insc.stagiaire.email || insc.stagiaire.telephone || '—'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-full rounded-full ${solde ? 'bg-green-500' : 'bg-orange-500'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {insc.montantPaye.toLocaleString('fr-TN')}/{insc.montantTotal.toLocaleString('fr-TN')}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                solde ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {solde ? 'Soldé' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Prochaines séances */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Prochaines séances</h3>
                <Link
                  href={`/sessions/${id}/planning`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Tout voir
                </Link>
              </div>
              {prochainePlanning.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Aucune séance à venir</p>
              ) : (
                <div className="space-y-3">
                  {prochainePlanning.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center min-w-[44px]">
                        <p className="text-xs text-gray-500 uppercase">{format(new Date(p.date), 'EEE', { locale: fr })}</p>
                        <p className="text-lg font-bold text-indigo-600">{format(new Date(p.date), 'dd')}</p>
                        <p className="text-xs text-gray-500">{format(new Date(p.date), 'MMM', { locale: fr })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{p.heureDebut} - {p.heureFin}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {p.formateur ? `${p.formateur.prenom} ${p.formateur.nom}` : 'Formateur non assigné'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.statut === 'effectue' ? 'bg-green-100 text-green-700' :
                        p.statut === 'annule' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.statut === 'effectue' ? 'Fait' : p.statut === 'annule' ? 'Annulé' : 'Planifié'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Récap financier */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif financier</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total attendu</span>
                  <span className="font-medium">{totalDu.toLocaleString('fr-TN')} TND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total encaissé</span>
                  <span className="font-medium text-green-600">{totalPaye.toLocaleString('fr-TN')} TND</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-500">Reste à percevoir</span>
                  <span className={`font-bold ${totalDu - totalPaye > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {(totalDu - totalPaye).toLocaleString('fr-TN')} TND
                  </span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  href={`/sessions/${id}/planning`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Gérer le planning</span>
                </Link>
                <Link
                  href={`/sessions/${id}/presences`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Gérer les présences</span>
                </Link>
                <Link
                  href={`/inscriptions/nouveau?sessionId=${id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Inscrire un stagiaire</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
