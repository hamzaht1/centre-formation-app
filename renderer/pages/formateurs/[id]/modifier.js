import { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../../lib/fetchWithAuth';

const JOURS_SEMAINE = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export default function ModifierFormateur() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialites: '',
    experience: '',
    statut: 'actif',
  });
  
  const [disponibilites, setDisponibilites] = useState([]);
  const [disponibilitesExistantes, setDisponibilitesExistantes] = useState([]);
  const [showDispoForm, setShowDispoForm] = useState(false);
  const [currentDispo, setCurrentDispo] = useState({
    jourSemaine: 1,
    heureDebut: '09:00',
    heureFin: '17:00',
    typeRecurrence: 'hebdomadaire',
    remarques: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchFormateur();
    fetchDisponibilites();
  }, [id]);

  const fetchFormateur = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/formateurs/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();

      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || '',
        specialites: data.specialites || '',
        experience: data.experience || '',
        statut: data.statut || 'actif',
      });
    } catch (err) {
      toast.error('Impossible de charger les données du formateur');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilites = async () => {
    try {
      const res = await fetchWithAuth(`/api/disponibilites?formateurId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDisponibilitesExistantes(data);
      }
    } catch (err) {
      console.error('Erreur chargement disponibilités:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDispoChange = (e) => {
    const { name, value } = e.target;
    setCurrentDispo((prev) => ({ 
      ...prev, 
      [name]: name === 'jourSemaine' ? parseInt(value) : value 
    }));
  };

  const ajouterDisponibilite = async () => {
    if (currentDispo.heureDebut >= currentDispo.heureFin) {
      toast.error('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/disponibilites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formateurId: parseInt(id),
          disponibilites: [currentDispo],
        }),
      });

      if (!res.ok) throw new Error('Erreur ajout');

      toast.success('Disponibilité ajoutée');
      fetchDisponibilites();
      setCurrentDispo({
        jourSemaine: 1,
        heureDebut: '09:00',
        heureFin: '17:00',
        typeRecurrence: 'hebdomadaire',
        remarques: '',
      });
      setShowDispoForm(false);
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de la disponibilité');
      console.error(err);
    }
  };

  const supprimerDisponibilite = async (dispoId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette disponibilité ?')) return;

    try {
      const res = await fetchWithAuth(`/api/disponibilites/${dispoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur suppression');

      toast.success('Disponibilité supprimée');
      fetchDisponibilites();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const toggleActifDisponibilite = async (dispoId, actif) => {
    try {
      const res = await fetchWithAuth(`/api/disponibilites/${dispoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif }),
      });

      if (!res.ok) throw new Error('Erreur mise à jour');

      toast.success(actif ? 'Disponibilité désactivée' : 'Disponibilité activée');
      fetchDisponibilites();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
      console.error(err);
    }
  };

  const getJourLabel = (jourValue) => {
    return JOURS_SEMAINE.find(j => j.value === jourValue)?.label || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetchWithAuth(`/api/formateurs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Échec mise à jour');

      toast.success('Formateur modifié avec succès');
      router.push(`/formateurs/${id}`);
    } catch (err) {
      toast.error('Erreur lors de la modification');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Chargement des données...</div>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Modifier le formateur : {formData.prenom} {formData.nom}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Informations personnelles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <input
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Spécialités</label>
              <textarea
                name="specialites"
                value={formData.specialites}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="ex: React, Node.js, Laravel, DevOps..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">Années d'expérience</label>
                <input
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Disponibilités */}
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Disponibilités hebdomadaires</h2>
              <button
                type="button"
                onClick={() => setShowDispoForm(!showDispoForm)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Ajouter une disponibilité
              </button>
            </div>

            {showDispoForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-green-200">
                <h3 className="font-medium mb-4">Nouvelle disponibilité</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jour de la semaine</label>
                    <select
                      name="jourSemaine"
                      value={currentDispo.jourSemaine}
                      onChange={handleDispoChange}
                      className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    >
                      {JOURS_SEMAINE.map(jour => (
                        <option key={jour.value} value={jour.value}>
                          {jour.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      name="typeRecurrence"
                      value={currentDispo.typeRecurrence}
                      onChange={handleDispoChange}
                      className="w-full border rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="hebdomadaire">Hebdomadaire</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="ponctuel">Ponctuel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Heure de début</label>
                    <input
                      type="time"
                      name="heureDebut"
                      value={currentDispo.heureDebut}
                      onChange={handleDispoChange}
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Heure de fin</label>
                    <input
                      type="time"
                      name="heureFin"
                      value={currentDispo.heureFin}
                      onChange={handleDispoChange}
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Remarques (optionnel)</label>
                    <input
                      type="text"
                      name="remarques"
                      value={currentDispo.remarques}
                      onChange={handleDispoChange}
                      placeholder="ex: Préfère le matin"
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDispoForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={ajouterDisponibilite}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* Liste des disponibilités */}
            {disponibilitesExistantes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune disponibilité enregistrée. Cliquez sur le bouton ci-dessus pour en ajouter.
              </div>
            ) : (
              <div className="space-y-3">
                {disponibilitesExistantes
                  .sort((a, b) => a.jourSemaine - b.jourSemaine || a.heureDebut.localeCompare(b.heureDebut))
                  .map((dispo) => (
                    <div 
                      key={dispo.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        dispo.actif ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {getJourLabel(dispo.jourSemaine)} - {dispo.heureDebut} à {dispo.heureFin}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dispo.typeRecurrence}
                          </span>
                          {!dispo.actif && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Désactivé
                            </span>
                          )}
                          {dispo.remarques && (
                            <span className="ml-2 text-gray-500">• {dispo.remarques}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => toggleActifDisponibilite(dispo.id, dispo.actif)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            dispo.actif 
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {dispo.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => supprimerDisponibilite(dispo.id)}
                          className="text-red-600 hover:text-red-800 font-medium px-3"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Boutons de soumission */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/formateurs/${id}`)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}