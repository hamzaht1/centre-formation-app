import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function NouvelleSession() {
  const router = useRouter();
  const { formationId } = router.query;
  const [formations, setFormations] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    formationId: formationId || '',
    formateurPrincipalId: '',
    dateDebut: '',
    dateFin: '',
    horaires: '',
    capaciteMax: '20',
    statut: 'a_venir',
  });

  useEffect(() => {
    fetchFormations();
    fetchFormateurs();
  }, []);

  useEffect(() => {
    if (formationId) {
      setFormData((prev) => ({ ...prev, formationId }));
    }
  }, [formationId]);

  const fetchFormations = async () => {
    try {
      const res = await fetchWithAuth('/api/formations?statut=active&limit=1000');
      const data = await res.json();
      setFormations(data.data || data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchFormateurs = async () => {
    try {
      const res = await fetchWithAuth('/api/formateurs?statut=actif');
      const data = await res.json();
      setFormateurs(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetchWithAuth('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Session créée avec succès');
        router.push('/sessions');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Link href="/sessions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux sessions
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Nouvelle Session
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la session *
              </label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Session Janvier 2025"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Formation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formation *
              </label>
              <select
                name="formationId"
                required
                value={formData.formationId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner une formation</option>
                {formations.map((formation) => (
                  <option key={formation.id} value={formation.id}>
                    {formation.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Formateur principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formateur principal
              </label>
              <select
                name="formateurPrincipalId"
                value={formData.formateurPrincipalId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Aucun formateur</option>
                {formateurs.map((formateur) => (
                  <option key={formateur.id} value={formateur.id}>
                    {formateur.nom} {formateur.prenom}
                  </option>
                ))}
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                name="dateDebut"
                required
                value={formData.dateDebut}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                name="dateFin"
                required
                value={formData.dateFin}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Horaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horaires
              </label>
              <input
                type="text"
                name="horaires"
                value={formData.horaires}
                onChange={handleChange}
                placeholder="Ex: Lun-Mer-Ven 9h-12h"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Capacité max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité maximale *
              </label>
              <input
                type="number"
                name="capaciteMax"
                required
                min="1"
                value={formData.capaciteMax}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="a_venir">À venir</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}