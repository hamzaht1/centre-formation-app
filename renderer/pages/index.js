import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import fetchWithAuth from '../lib/fetchWithAuth';

export default function Dashboard() {
  const [stats, setStats] = useState({
    stagiaires: 0,
    sessionsEnCours: 0,
    formateurs: 0,
    formations: 0,
    tauxPresence: 0,
    nouvellesInscriptions: 0,
    revenusMois: 0,
    sessionsAVenir: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Conteneur principal avec transition fluide pour s'adapter au sidebar collapsed */}
      <div className="w-full transition-all duration-300 ease-in-out">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenue, voici un aperçu de votre centre de formation aujourd'hui.
          </p>
        </div>

        {/* Statistiques Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Stagiaires"
            value={stats.stagiaires}
            icon="users"
            color="bg-blue-50 text-blue-600"
            link="/stagiaires"
          />
          <StatCard
            title="Sessions en Cours"
            value={stats.sessionsEnCours}
            icon="book-open"
            color="bg-indigo-50 text-indigo-600"
            link="/sessions"
          />
          <StatCard
            title="Formateurs"
            value={stats.formateurs}
            icon="user-group"
            color="bg-purple-50 text-purple-600"
            link="/formateurs"
          />
          <StatCard
            title="Formations"
            value={stats.formations}
            icon="academic-cap"
            color="bg-amber-50 text-amber-600"
            link="/formations"
          />
        </div>

        {/* Statistiques Secondaires & Graphiques (Ici mises en cartes plus larges) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCardLarge
            title="Taux de Présence"
            value={`${stats.tauxPresence}%`}
            icon="check-circle"
            color="text-green-600"
            subtext="Moyenne mensuelle"
            bgColor="bg-green-50"
          />
          <StatCardLarge
            title="Nouvelles Inscriptions"
            value={stats.nouvellesInscriptions}
            icon="document-text"
            color="text-blue-600"
            subtext="30 derniers jours"
            bgColor="bg-blue-50"
          />
          <StatCardLarge
            title="Revenus du Mois"
            value={`${stats.revenusMois.toLocaleString()} DT`}
            icon="currency-dollar"
            color="text-emerald-600"
            subtext="Ce mois"
            bgColor="bg-emerald-50"
          />
        </div>

        {/* Sessions à Venir */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Sessions à Venir</h2>
            <Link
              href="/sessions"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {stats.sessionsAVenir.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">Aucune session à venir programmée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.sessionsAVenir.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// --- Composant Carte Statistique Simple ---
function StatCard({ title, value, icon, color, link }) {
  // Icônes SVG
  const icons = {
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    'book-open': <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    'user-group': <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    'academic-cap': <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />,
  };

  const content = (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-default group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            {icons[icon]}
          </svg>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

// --- Composant Carte Statistique Large (Secondaire) ---
function StatCardLarge({ title, value, icon, color, subtext, bgColor }) {
  const icons = {
    'check-circle': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    'document-text': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    'currency-dollar': <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-full ${bgColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 ${color}`}>
            {icons[icon]}
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
      </div>
    </div>
  );
}

// --- Composant Carte Session ---
function SessionCard({ session }) {
  // Calcul du pourcentage de remplissage
  const fillPercentage = session.capaciteMax > 0 
    ? Math.round((session._count.inscriptions / session.capaciteMax) * 100) 
    : 0;

  return (
    <Link href={`/sessions/${session.id}`}>
      <div className="group flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer">
        
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
              {session.nom}
            </h3>
            <span className="text-xs text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full bg-white">
              {session.formation.nom}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{format(new Date(session.dateDebut), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
            
            {session.formateur && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>{session.formateur.prenom} {session.formateur.nom}</span>
              </div>
            )}
          </div>

          {/* Barre de progression capacité */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {session._count.inscriptions}/{session.capaciteMax}
            </span>
          </div>
        </div>

        <div className="hidden sm:block">
          <StatusBadge status={session.statut} />
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }) {
  const styles = {
    a_venir: 'bg-blue-100 text-blue-700 border-blue-200',
    en_cours: 'bg-green-100 text-green-700 border-green-200',
    terminee: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    a_venir: 'À venir',
    en_cours: 'En cours',
    terminee: 'Terminée',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.terminee}`}>
      {labels[status] || status}
    </span>
  );
}