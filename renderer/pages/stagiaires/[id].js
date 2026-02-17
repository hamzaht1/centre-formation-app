import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function DetailsStagiaire() {
  const router = useRouter();
  const { id } = router.query;
  const [stagiaire, setStagiaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLivres, setSelectedLivres] = useState([]);
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [modePaiement, setModePaiement] = useState('especes');
  const [payerReference, setPayerReference] = useState('');
  const [paying, setPaying] = useState(false);

  // For manual attribution
  const [showAttribuerForm, setShowAttribuerForm] = useState(false);
  const [formations, setFormations] = useState([]);
  const [livresDisponibles, setLivresDisponibles] = useState([]);
  const [attribFormationId, setAttribFormationId] = useState('');
  const [attribLivreId, setAttribLivreId] = useState('');

  useEffect(() => {
    if (id) {
      fetchStagiaire();
    }
  }, [id]);

  const fetchStagiaire = async () => {
    try {
      const res = await fetchWithAuth(`/api/stagiaires/${id}`);
      const data = await res.json();
      setStagiaire(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const fetchFormations = async () => {
    try {
      const res = await fetchWithAuth('/api/formations?statut=active&limit=1000');
      if (res.ok) {
        const data = await res.json();
        setFormations(data.data || data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLivresForFormation = async (formationId) => {
    try {
      const res = await fetchWithAuth(`/api/livres?formationId=${formationId}`);
      if (res.ok) {
        const data = await res.json();
        setLivresDisponibles(data.filter((l) => l.quantite > 0));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleLivre = (lsId) => {
    setSelectedLivres((prev) =>
      prev.includes(lsId) ? prev.filter((x) => x !== lsId) : [...prev, lsId]
    );
  };

  const handlePayerLivres = async () => {
    if (selectedLivres.length === 0) return;
    setPaying(true);
    try {
      const res = await fetchWithAuth('/api/livre-stagiaire/payer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagiaireId: parseInt(id),
          livreStagiaireIds: selectedLivres,
          modePaiement,
          reference: payerReference || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur paiement');
      }
      toast.success('Paiement enregistre avec succes');
      setSelectedLivres([]);
      setShowPayerModal(false);
      setModePaiement('especes');
      setPayerReference('');
      fetchStagiaire();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleAttribuerLivre = async () => {
    if (!attribLivreId) return;
    try {
      const res = await fetchWithAuth('/api/livre-stagiaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livreId: parseInt(attribLivreId),
          stagiaireId: parseInt(id),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur attribution');
      }
      toast.success('Livre attribue avec succes');
      setShowAttribuerForm(false);
      setAttribFormationId('');
      setAttribLivreId('');
      setLivresDisponibles([]);
      fetchStagiaire();
    } catch (err) {
      toast.error(err.message);
    }
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

  if (!stagiaire) {
    return (
      <Layout>
        <div className="text-center">Stagiaire non trouvé</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/stagiaires" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux stagiaires
      </Link>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {stagiaire.nom} {stagiaire.prenom}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/stagiaires/${id}/modifier`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Modifier
            </Link>
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Retour
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{stagiaire.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{stagiaire.telephone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de naissance</p>
                <p className="font-medium">
                  {stagiaire.dateNaissance
                    ? format(new Date(stagiaire.dateNaissance), 'dd/MM/yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profession</p>
                <p className="font-medium">{stagiaire.profession || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Niveau d'études</p>
                <p className="font-medium">{stagiaire.niveauEtudes || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-medium">
                  <span
                    className={`px-2 py-1 rounded ${
                      stagiaire.statut === 'actif'
                        ? 'bg-green-100 text-green-800'
                        : stagiaire.statut === 'diplome'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stagiaire.statut}
                  </span>
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="font-medium">{stagiaire.adresse || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact d'urgence</p>
                <p className="font-medium">{stagiaire.contactUrgence || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone d'urgence</p>
                <p className="font-medium">
                  {stagiaire.telephoneUrgence || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            {stagiaire.stats && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Inscriptions</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {stagiaire.stats.nombreInscriptions}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    formations suivies
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Présences</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de présence</span>
                      <span className="font-bold text-green-600">
                        {stagiaire.stats.tauxPresence}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium">
                        {stagiaire.stats.totalPresences}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Paiements</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {stagiaire.stats.totalPaye.toFixed(2)} DT
                  </p>
                  <p className="text-sm text-gray-600 mt-2">total payé</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Livres</h3>
                  <p className="text-2xl font-bold text-amber-600">
                    {stagiaire.stats.livresAttribues}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {stagiaire.stats.livresPayes} paye{stagiaire.stats.livresPayes !== 1 ? 's' : ''} / {stagiaire.stats.livresNonPayes} non paye{stagiaire.stats.livresNonPayes !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Inscriptions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Inscriptions</h2>
          <div className="space-y-3">
            {stagiaire.inscriptions?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucune inscription
              </p>
            ) : (
              stagiaire.inscriptions?.map((inscription) => (
                <div
                  key={inscription.id}
                  className="border-l-4 border-blue-500 pl-4 py-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {inscription.session.formation.nom}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Session: {inscription.session.nom}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          Montant: {inscription.montantTotal.toFixed(2)} DT
                        </span>
                        <span>
                          Payé: {inscription.montantPaye.toFixed(2)} DT
                        </span>
                        <span
                          className={
                            inscription.montantPaye >= inscription.montantTotal
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {inscription.montantPaye >= inscription.montantTotal
                            ? '✓ Soldé'
                            : `Reste: ${(
                                inscription.montantTotal -
                                inscription.montantPaye
                              ).toFixed(2)} DT`}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inscription.statut === 'en_cours'
                          ? 'bg-green-100 text-green-800'
                          : inscription.statut === 'terminee'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inscription.statut}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historique des paiements */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Historique des paiements
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Mode
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Référence
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Remarques
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stagiaire.paiements?.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Aucun paiement enregistré
                    </td>
                  </tr>
                ) : (
                  stagiaire.paiements?.map((paiement) => (
                    <tr key={paiement.id}>
                      <td className="px-4 py-2">
                        {format(
                          new Date(paiement.datePaiement),
                          'dd/MM/yyyy'
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-green-600">
                        {paiement.montant.toFixed(2)} DT
                      </td>
                      <td className="px-4 py-2">{paiement.modePaiement}</td>
                      <td className="px-4 py-2">
                        {paiement.reference || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {paiement.remarques || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Livres attribués */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Livres attribués</h2>
            <div className="flex gap-2">
              {selectedLivres.length > 0 && (
                <button
                  onClick={() => setShowPayerModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Payer les livres sélectionnés ({selectedLivres.length})
                </button>
              )}
              <button
                onClick={() => {
                  setShowAttribuerForm(!showAttribuerForm);
                  if (!showAttribuerForm && formations.length === 0) fetchFormations();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Attribuer un livre
              </button>
            </div>
          </div>

          {/* Formulaire d'attribution manuelle */}
          {showAttribuerForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Formation</label>
                  <select
                    value={attribFormationId}
                    onChange={(e) => {
                      setAttribFormationId(e.target.value);
                      setAttribLivreId('');
                      if (e.target.value) fetchLivresForFormation(e.target.value);
                      else setLivresDisponibles([]);
                    }}
                    className="w-full border rounded px-3 py-2 bg-white text-sm"
                  >
                    <option value="">-- Formation --</option>
                    {formations.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Livre</label>
                  <select
                    value={attribLivreId}
                    onChange={(e) => setAttribLivreId(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-white text-sm"
                    disabled={!attribFormationId}
                  >
                    <option value="">-- Livre --</option>
                    {livresDisponibles.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nom} ({l.prix} TND - Stock: {l.quantite})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAttribuerLivre}
                  disabled={!attribLivreId}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                  Attribuer
                </button>
                <button
                  onClick={() => { setShowAttribuerForm(false); setAttribFormationId(''); setAttribLivreId(''); }}
                  className="text-gray-500 hover:text-gray-700 px-2 py-2 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Livre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Formation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stagiaire.livresStagiaires?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      Aucun livre attribué
                    </td>
                  </tr>
                ) : (
                  stagiaire.livresStagiaires?.map((ls) => (
                    <tr key={ls.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {!ls.paiementId && (
                          <input
                            type="checkbox"
                            checked={selectedLivres.includes(ls.id)}
                            onChange={() => handleToggleLivre(ls.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        <Link href={`/livres/${ls.livreId}`} className="text-blue-600 hover:underline">
                          {ls.livre.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {ls.livre.formation?.nom || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {format(new Date(ls.dateAttribution), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {ls.prixUnitaire.toFixed(2)} DT
                      </td>
                      <td className="px-4 py-2">
                        {ls.paiement ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paye
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Non paye
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal paiement livres */}
        {showPayerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Payer les livres sélectionnés</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedLivres.length} livre{selectedLivres.length > 1 ? 's' : ''} - Total :{' '}
                {stagiaire.livresStagiaires
                  ?.filter((ls) => selectedLivres.includes(ls.id))
                  .reduce((sum, ls) => sum + ls.prixUnitaire, 0)
                  .toFixed(2)}{' '}
                DT
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mode de paiement</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                    <option value="carte">Carte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Référence (optionnel)</label>
                  <input
                    value={payerReference}
                    onChange={(e) => setPayerReference(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Numéro de référence"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowPayerModal(false); setModePaiement('especes'); setPayerReference(''); }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePayerLivres}
                  disabled={paying}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {paying ? 'Paiement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}