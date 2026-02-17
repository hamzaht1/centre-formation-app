import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import fetchWithAuth from '../../../lib/fetchWithAuth';

const statutPlanningConfig = {
  planifie: { label: 'Planifié', bg: 'bg-blue-100', text: 'text-blue-700' },
  effectue: { label: 'Effectué', bg: 'bg-green-100', text: 'text-green-700' },
  annule: { label: 'Annulé', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function SessionPlanning() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState(null);
  const [planning, setPlanning] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [salles, setSalles] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [verification, setVerification] = useState(null);
  const [checkingDisponibilites, setCheckingDisponibilites] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    daysOfWeek: [1, 2, 3, 4, 5],
    heureDebut: '09:00',
    heureFin: '12:00',
    formateurId: '',
    salleId: '',
  });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  useEffect(() => {
    if (formData.formateurId || formData.salleId) {
      checkDisponibilites();
    } else {
      setVerification(null);
    }
  }, [formData.formateurId, formData.salleId, formData.startDate, formData.heureDebut, formData.heureFin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSession, resPlanning, resFormateurs, resSalles] = await Promise.all([
        fetchWithAuth(`/api/sessions/${id}`),
        fetchWithAuth(`/api/planning?sessionId=${id}`),
        fetchWithAuth('/api/formateurs'),
        fetchWithAuth('/api/salles'),
      ]);

      if (!resSession.ok || !resPlanning.ok || !resFormateurs.ok || !resSalles.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      setSession(await resSession.json());
      setPlanning(await resPlanning.json());
      setFormateurs(await resFormateurs.json());
      setSalles(await resSalles.json());
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const checkDisponibilites = async () => {
    if (!formData.formateurId && !formData.salleId) return;
    setCheckingDisponibilites(true);
    try {
      const params = new URLSearchParams();
      if (formData.formateurId) params.append('formateurId', formData.formateurId);
      if (formData.salleId) params.append('salleId', formData.salleId);
      if (formData.startDate) params.append('date', formData.startDate);
      if (formData.heureDebut) params.append('heureDebut', formData.heureDebut);
      if (formData.heureFin) params.append('heureFin', formData.heureFin);
      const res = await fetchWithAuth(`/api/disponibilites/check?${params}`);
      if (res.ok) {
        setVerification(await res.json());
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
    } finally {
      setCheckingDisponibilites(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        daysOfWeek: checked
          ? [...prev.daysOfWeek, parseInt(value)]
          : prev.daysOfWeek.filter((d) => d !== parseInt(value)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.formateurId || !formData.startDate) {
      toast.error('Formateur et date de début sont obligatoires');
      return;
    }
    setGenerating(true);
    setGenerationResult(null);
    try {
      const res = await fetchWithAuth(`/api/planning/session/${id}/weekly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la génération');
      setGenerationResult(data);
      if (data.conflicts && data.conflicts.length > 0) {
        toast.success(`${data.summary.created} séances créées, ${data.summary.conflicts} conflits`, { duration: 5000 });
      } else {
        toast.success(data.message);
      }
      fetchData();
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday first
  };
  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };
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
  const getEventsForDate = (dateObj) => {
    const ds = dateObj.toDateString();
    return planning.filter((item) => new Date(item.date).toDateString() === ds);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-xl text-gray-600">Chargement...</span>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Session non trouvée</h2>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Retour</button>
        </div>
      </Layout>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIdx = getFirstDayOfMonth(currentDate);
  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const seancesPlanifiees = planning.filter((p) => p.statut === 'planifie').length;
  const seancesEffectuees = planning.filter((p) => p.statut === 'effectue').length;
  const seancesAnnulees = planning.filter((p) => p.statut === 'annule').length;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
              <p className="text-gray-500 text-sm mt-1">
                {session.nom} — {session.formation?.nom}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'calendar', label: 'Mois' },
                  { key: 'week', label: 'Semaine' },
                  { key: 'list', label: 'Liste' },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === v.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showGenerator ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Générer
              </button>
              <button
                onClick={() => router.push(`/sessions/${id}`)}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        </div>

        {/* Stats mini */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{seancesPlanifiees}</p>
              <p className="text-xs text-gray-500">Planifiées</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{seancesEffectuees}</p>
              <p className="text-xs text-gray-500">Effectuées</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{seancesAnnulees}</p>
              <p className="text-xs text-gray-500">Annulées</p>
            </div>
          </div>
        </div>

        {/* Generator panel */}
        {showGenerator && (
          <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Génération automatique</h2>
              <p className="text-sm text-gray-500 mt-1">Créer des séances hebdomadaires jusqu'à la fin de la session</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formateur *</label>
                    <select name="formateurId" value={formData.formateurId} onChange={handleChange} required
                      className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Sélectionner</option>
                      {formateurs.map((f) => <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                    <select name="salleId" value={formData.salleId} onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Sélectionner</option>
                      {salles.filter(s => s.statut === 'disponible').map((s) => (
                        <option key={s.id} value={s.id}>{s.nom} ({s.capacite} places)</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                      <input type="time" name="heureDebut" value={formData.heureDebut} onChange={handleChange} required
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                      <input type="time" name="heureFin" value={formData.heureFin} onChange={handleChange} required
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                {/* Jours de la semaine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jours de la semaine</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 1, label: 'Lun' }, { val: 2, label: 'Mar' }, { val: 3, label: 'Mer' },
                      { val: 4, label: 'Jeu' }, { val: 5, label: 'Ven' }, { val: 6, label: 'Sam' }, { val: 0, label: 'Dim' },
                    ].map((d) => (
                      <label key={d.val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.daysOfWeek.includes(d.val) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                        <input type="checkbox" value={d.val} checked={formData.daysOfWeek.includes(d.val)} onChange={handleChange}
                          className="sr-only" />
                        <span className="text-sm font-medium">{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Verification */}
                {verification?.verification && (
                  <div className={`p-4 rounded-lg border ${
                    verification.verification.disponible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{verification.verification.disponible ? '✓' : '!'}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${
                          verification.verification.disponible ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {verification.verification.resume?.message || (verification.verification.disponible ? 'Créneau disponible' : 'Conflit détecté')}
                        </p>
                        {verification.verification.problemes?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {verification.verification.problemes.map((p, i) => (
                              <li key={i} className="text-sm text-red-700">{p.message}</li>
                            ))}
                          </ul>
                        )}
                        {verification.verification.avertissements?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {verification.verification.avertissements.map((w, i) => (
                              <li key={i} className="text-sm text-yellow-700">{w.message}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generation result */}
                {generationResult && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Résultat</h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{generationResult.summary.created}</p>
                        <p className="text-xs text-gray-600">Créées</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">{generationResult.summary.conflicts}</p>
                        <p className="text-xs text-gray-600">Conflits</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{generationResult.summary.total}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>
                    {generationResult.conflicts?.length > 0 && (
                      <div className="space-y-1">
                        {generationResult.conflicts.map((c, i) => (
                          <p key={i} className="text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded">
                            {c.day} {c.date} : {c.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="submit" disabled={generating}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors">
                    {generating ? 'Génération...' : 'Générer le planning'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Aujourd'hui</button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7">
              {dayLabels.map((d) => (
                <div key={d} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b bg-gray-50">{d}</div>
              ))}

              {Array.from({ length: firstDayIdx }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[120px] border-b border-r bg-gray-50/50"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const events = getEventsForDate(dateObj);
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <div key={day} className={`min-h-[120px] border-b border-r p-1.5 hover:bg-blue-50/50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full mb-1 ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                    }`}>
                      {day}
                    </span>
                    <div className="space-y-1">
                      {events.map((evt) => {
                        const cfg = statutPlanningConfig[evt.statut] || statutPlanningConfig.planifie;
                        return (
                          <div key={evt.id}
                            className={`text-[11px] px-1.5 py-1 rounded ${cfg.bg} ${cfg.text} cursor-default truncate`}
                            title={`${evt.heureDebut}-${evt.heureFin} | ${evt.formateur?.prenom} ${evt.formateur?.nom} | ${evt.salle?.nom || 'Pas de salle'}`}
                          >
                            <span className="font-semibold">{evt.heureDebut}</span> {evt.formateur?.prenom?.[0]}.{evt.formateur?.nom}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week view */}
        {viewMode === 'week' && (() => {
          const weekDays = getWeekDays();
          return (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  {format(weekDays[0], 'dd MMM', { locale: fr })} — {format(weekDays[6], 'dd MMM yyyy', { locale: fr })}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cette semaine</button>
                  <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7">
                {weekDays.map((day, idx) => {
                  const isToday = new Date().toDateString() === day.toDateString();
                  const events = getEventsForDate(day);
                  return (
                    <div key={idx} className="border-r last:border-r-0">
                      <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="text-xs font-semibold text-gray-500 uppercase">{dayLabels[idx]}</div>
                        <span className={`inline-flex items-center justify-center w-9 h-9 text-lg font-bold rounded-full mt-1 ${
                          isToday ? 'bg-blue-600 text-white' : 'text-gray-800'
                        }`}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="min-h-[250px] p-2 space-y-2">
                        {events.length === 0 && (
                          <p className="text-xs text-gray-300 text-center mt-16">—</p>
                        )}
                        {events.map((evt) => {
                          const cfg = statutPlanningConfig[evt.statut] || statutPlanningConfig.planifie;
                          return (
                            <div key={evt.id} className={`p-2.5 rounded-lg border ${cfg.bg} ${cfg.text}`}>
                              <p className="text-xs font-bold">{evt.heureDebut} - {evt.heureFin}</p>
                              <p className="text-[11px] mt-1 truncate">{evt.formateur?.prenom} {evt.formateur?.nom}</p>
                              {evt.salle && <p className="text-[10px] opacity-75 truncate">{evt.salle.nom}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Toutes les séances ({planning.length})</h2>
            </div>
            {planning.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Aucune séance programmée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-500">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Horaire</th>
                      <th className="px-5 py-3 font-medium">Formateur</th>
                      <th className="px-5 py-3 font-medium">Salle</th>
                      <th className="px-5 py-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {planning.map((item) => {
                      const cfg = statutPlanningConfig[item.statut] || statutPlanningConfig.planifie;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {format(new Date(item.date), 'EEEE dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{item.heureDebut} - {item.heureFin}</span>
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {item.formateur?.prenom} {item.formateur?.nom}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {item.salle?.nom || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
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
        )}
      </div>
    </Layout>
  );
}
