import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import fetchWithAuth from '../../../lib/fetchWithAuth';

export default function SalleDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [salle, setSalle] = useState(null);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return seances.filter((p) => {
      const d = new Date(p.date);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
    });
  };

  useEffect(() => {
    if (!id) return;
    fetchSalle();
  }, [id]);

  const fetchSalle = async () => {
    try {
      setLoading(true);
      const [resSalle, resSeances] = await Promise.all([
        fetchWithAuth(`/api/salles/${id}`),
        fetchWithAuth(`/api/planning?salleId=${id}`),
      ]);
      if (!resSalle.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await resSalle.json();
      setSalle(data);
      if (resSeances.ok) {
        setSeances(await resSeances.json());
      }
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les informations de la salle');
    } finally {
      setLoading(false);
    }
  };

  const deleteSalle = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette salle ? Cette action est irréversible.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/salles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Échec suppression');
      }
      
      toast.success('Salle supprimée avec succès');
      router.push('/salles');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement de la salle...</div>
        </div>
      </Layout>
    );
  }

  if (!salle) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Salle non trouvée</h2>
          <Link href="/salles" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{salle.nom}</h1>
          <div className="flex gap-4">
            <Link
              href={`/salles/${id}/modifier`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Modifier
            </Link>
            <button
              onClick={deleteSalle}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>

        {/* Informations de la salle */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Informations de la salle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Capacité</p>
                <p className="font-medium text-lg">{salle.capacite} places</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bâtiment</p>
                <p className="font-medium">{salle.batiment || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Étage</p>
                <p className="font-medium">{salle.etage || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {salle.type}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    salle.statut === 'disponible'
                      ? 'bg-green-100 text-green-800'
                      : salle.statut === 'maintenance'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {salle.statut}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sessions actives</p>
                <p className="font-medium">{salle._count?.sessions || 0}</p>
              </div>
            </div>

            {salle.equipements && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Équipements</p>
                <p className="font-medium text-gray-700">{salle.equipements}</p>
              </div>
            )}

            {salle.remarques && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Remarques</p>
                <p className="font-medium text-gray-700">{salle.remarques}</p>
              </div>
            )}
          </div>
        </div>

        {/* Séances programmées - Vue semaine */}
        {(() => {
          const weekDays = getWeekDays();
          const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          const weekStart = weekDays[0];
          const weekEnd = weekDays[6];

          return (
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Séances programmées</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
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
                      <div className={`p-2 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{dayNames[idx]}</div>
                        <div className={`text-lg font-bold mt-1`}>
                          <span className={`inline-flex justify-center items-center w-8 h-8 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                            {day.getDate()}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {day.toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div className="min-h-[160px] p-1.5 space-y-1.5">
                        {events.length === 0 && (
                          <div className="text-xs text-gray-300 text-center mt-12">—</div>
                        )}
                        {events.map((evt) => (
                          <div
                            key={evt.id}
                            className="text-xs p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
                          >
                            <div className="font-bold text-blue-800">{evt.heureDebut} - {evt.heureFin}</div>
                            <div className="font-medium text-gray-800 truncate mt-0.5">
                              {evt.session?.formation?.nom || '—'}
                            </div>
                            <div className="text-gray-500 truncate text-[11px]">
                              {evt.session?.nom || ''}
                            </div>
                            {evt.formateur && (
                              <div className="text-gray-600 truncate text-[11px] mt-0.5">
                                {evt.formateur.prenom} {evt.formateur.nom}
                              </div>
                            )}
                            <span className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                              evt.statut === 'effectue' ? 'bg-green-100 text-green-700' :
                              evt.statut === 'annule' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {evt.statut}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {seances.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  Aucune séance programmée dans cette salle
                </div>
              )}
            </div>
          );
        })()}

        <div className="mt-8">
          <Link href="/salles" className="text-blue-600 hover:underline">
            ← Retour à la liste des salles
          </Link>
        </div>
      </div>
    </Layout>
  );
}