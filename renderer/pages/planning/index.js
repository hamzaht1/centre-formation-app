import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Planning() {
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormateur, setFilterFormateur] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [viewMode, setViewMode] = useState('week');

  // Semaine
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const changeWeek = (offset) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + offset * 7);
    setCurrentWeekStart(d);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getEventsForDay = (day) => {
    return filteredPlannings.filter((p) => {
      const d = new Date(p.date);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
    });
  };

  // Pour les filtres select (formateurs et sessions)
  const [formateurs, setFormateurs] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchFilters();
    fetchPlanning();
  }, [filterFormateur, filterSession]);

  const fetchFilters = async () => {
    try {
      const [resF, resS] = await Promise.all([
        fetchWithAuth('/api/formateurs'),
        fetchWithAuth('/api/sessions'), // suppose que cette route existe
      ]);
      if (resF.ok) setFormateurs(await resF.json());
      if (resS.ok) setSessions(await resS.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlanning = async () => {
    try {
      setLoading(true);
      let url = '/api/planning';
      const params = new URLSearchParams();
      if (filterFormateur) params.append('formateurId', filterFormateur);
      if (filterSession) params.append('sessionId', filterSession);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setPlannings(data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  };

  const deletePlanning = async (id) => {
    if (!confirm('Supprimer cette séance du planning ?')) return;

    try {
      const res = await fetchWithAuth(`/api/planning/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Séance supprimée');
      fetchPlanning();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPlannings = plannings.filter((p) =>
    searchTerm
      ? p.session?.formation?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.session?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${p.formateur?.prenom || ''} ${p.formateur?.nom || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement du planning...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Planning des séances</h1>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Liste
              </button>
            </div>
            <Link
              href="/planning/nouveau"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              + Nouvelle séance
            </Link>
          </div>
        </div>

        {/* Filtres (communs aux deux vues) */}
        <div className="bg-white rounded-lg shadow mb-6 p-4 space-y-4">
          <input
            type="text"
            placeholder="Rechercher par formation, session, formateur..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="border rounded px-4 py-2 bg-white min-w-[220px]"
            >
              <option value="">Toutes les sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.formation?.nom} — {s.nom}
                </option>
              ))}
            </select>
            <select
              value={filterFormateur}
              onChange={(e) => setFilterFormateur(e.target.value)}
              className="border rounded px-4 py-2 bg-white min-w-[220px]"
            >
              <option value="">Tous les formateurs</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.prenom} {f.nom}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setFilterSession('');
                setFilterFormateur('');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Vue Semaine - desktop only */}
        {viewMode === 'week' && (() => {
          const weekDays = getWeekDays();
          const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          const weekStart = weekDays[0];
          const weekEnd = weekDays[6];

          return (
            <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white rounded-lg transition shadow-sm border">←</button>
                  <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="px-4 py-2 text-sm bg-white border hover:bg-gray-50 rounded-lg shadow-sm font-medium">Cette semaine</button>
                  <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white rounded-lg transition shadow-sm border">→</button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-l border-t">
                {weekDays.map((day, idx) => {
                  const isToday = new Date().toDateString() === day.toDateString();
                  const events = getEventsForDay(day);

                  return (
                    <div key={idx} className="border-r border-b">
                      <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{dayNames[idx]}</div>
                        <div className={`text-lg font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                          <span className={`inline-flex justify-center items-center w-9 h-9 rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                            {day.getDate()}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {day.toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div className="min-h-[220px] p-2 space-y-2">
                        {events.length === 0 && (
                          <div className="text-xs text-gray-300 text-center mt-16">Aucune séance</div>
                        )}
                        {events.map((evt) => (
                          <Link
                            key={evt.id}
                            href={`/sessions/${evt.sessionId}/planning`}
                            className="block text-xs p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 shadow-sm transition-all cursor-pointer"
                          >
                            <div className="font-bold text-blue-800">{evt.heureDebut} - {evt.heureFin}</div>
                            <div className="font-medium text-gray-800 truncate mt-1">
                              {evt.session?.formation?.nom || '—'}
                            </div>
                            <div className="text-gray-500 truncate text-[11px]">
                              {evt.session?.nom || ''}
                            </div>
                            {evt.formateur && (
                              <div className="text-gray-600 truncate mt-1 text-[11px]">
                                {evt.formateur.prenom} {evt.formateur.nom}
                              </div>
                            )}
                            {evt.salle && (
                              <div className="text-gray-500 truncate text-[10px]">
                                {evt.salle.nom}
                              </div>
                            )}
                            <span className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                              evt.statut === 'effectue' ? 'bg-green-100 text-green-700' :
                              evt.statut === 'annule' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {evt.statut}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Vue Liste - desktop table + mobile cards (shown when list mode OR on mobile always) */}
        {(viewMode === 'list' || true) && (
        <div className={`bg-white rounded-lg shadow ${viewMode === 'week' ? 'lg:hidden' : ''}`}>
          {/* Table desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formation / Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlannings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Aucune séance trouvée</td>
                  </tr>
                ) : (
                  filteredPlannings.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{new Date(p.date).toLocaleDateString('fr-TN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.heureDebut} → {p.heureFin}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{p.session?.formation?.nom || '—'}</div>
                        <div className="text-sm text-gray-600">{p.session?.nom || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.formateur ? `${p.formateur.prenom} ${p.formateur.nom}` : '—'}</td>
                      <td className="px-6 py-4">{p.salle?.nom || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          p.statut === 'effectue' ? 'bg-green-100 text-green-800'
                            : p.statut === 'annule' ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>{p.statut}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/sessions/${p.sessionId}/planning`} className="text-blue-600 hover:text-blue-900 mr-4">Voir</Link>
                        <button onClick={() => deletePlanning(p.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredPlannings.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">Aucune séance trouvée</div>
            ) : (
              filteredPlannings.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900">{p.session?.formation?.nom || '—'}</span>
                    <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                      p.statut === 'effectue' ? 'bg-green-100 text-green-800'
                        : p.statut === 'annule' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>{p.statut}</span>
                  </div>
                  <div className="text-sm text-gray-500">{p.session?.nom || '—'}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(p.date).toLocaleDateString('fr-TN')} · {p.heureDebut} → {p.heureFin}
                  </div>
                  <div className="text-sm text-gray-500">
                    {p.formateur ? `${p.formateur.prenom} ${p.formateur.nom}` : '—'} {p.salle ? `· ${p.salle.nom}` : ''}
                  </div>
                  <div className="flex justify-end gap-4 pt-2 border-t text-sm font-medium">
                    <Link href={`/sessions/${p.sessionId}/planning`} className="text-blue-600 hover:text-blue-900">Voir</Link>
                    <button onClick={() => deletePlanning(p.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
}