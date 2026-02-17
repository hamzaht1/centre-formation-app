import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function InscriptionDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchInscription();
  }, [id]);

  const fetchInscription = async () => {
    try {
      const res = await fetchWithAuth(`/api/inscriptions/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setInscription(data);
    } catch (error) {
      toast.error("Impossible de charger les détails de l'inscription");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInscription = async () => {
    if (!confirm('Supprimer cette inscription ?')) return;

    try {
      const res = await fetchWithAuth(`/api/inscriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Inscription supprimée');
      router.push('/inscriptions');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF();
      const insc = inscription;
      const stagiaire = insc.stagiaire;
      const session = insc.session;
      const formation = session?.formation;
      const reste = (insc.montantTotal || 0) - (insc.montantPaye || 0);

      const tableOpts = (startY, body, opts = {}) => {
        autoTable(doc, {
          startY,
          head: [],
          body,
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 45 },
            1: { textColor: [30, 30, 30] },
          },
          margin: { left: 14, right: 14 },
          ...opts,
        });
      };

      const sectionTitle = (text, yPos) => {
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(text, 14, yPos);
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(14, yPos + 2, 196, yPos + 2);
      };

      const getFinalY = () => doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 80;

      // --- Header ---
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("FICHE D'INSCRIPTION", 105, 18, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`N\u00B0 ${String(insc.id).padStart(4, '0')}`, 105, 28, { align: 'center' });
      doc.text(`Date: ${new Date(insc.dateInscription).toLocaleDateString('fr-TN')}`, 105, 34, { align: 'center' });

      // --- Stagiaire ---
      let y = 52;
      sectionTitle('STAGIAIRE', y);
      tableOpts(y + 10, [
        ['Nom complet', `${stagiaire?.prenom || ''} ${stagiaire?.nom || ''}`],
        ['Email', stagiaire?.email || '\u2014'],
        ['Telephone', stagiaire?.telephone || '\u2014'],
      ]);

      // --- Formation / Session ---
      y = getFinalY() + 10;
      sectionTitle('FORMATION / SESSION', y);
      tableOpts(y + 10, [
        ['Formation', formation?.nom || '\u2014'],
        ['Session', session?.nom || '\u2014'],
        ['Periode', `${session?.dateDebut ? new Date(session.dateDebut).toLocaleDateString('fr-TN') : '\u2014'} au ${session?.dateFin ? new Date(session.dateFin).toLocaleDateString('fr-TN') : '\u2014'}`],
        ['Duree', formation?.dureeHeures ? `${formation.dureeHeures} heures` : '\u2014'],
        ['Niveau', formation?.niveau || '\u2014'],
      ]);

      // --- Financier ---
      y = getFinalY() + 10;
      sectionTitle('INFORMATIONS FINANCIERES', y);
      autoTable(doc, {
        startY: y + 10,
        head: [['Description', 'Montant (TND)']],
        body: [
          ['Montant total', `${(insc.montantTotal || 0).toLocaleString('fr-TN')} TND`],
          ['Montant paye', `${(insc.montantPaye || 0).toLocaleString('fr-TN')} TND`],
          ['Reste a payer', `${reste.toLocaleString('fr-TN')} TND`],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      // --- Statut ---
      y = getFinalY() + 10;
      sectionTitle('STATUT', y);
      const statutLabel = insc.statut === 'en_cours' ? 'En cours' : insc.statut === 'terminee' ? 'Terminee' : 'Abandonnee';
      const statutBody = [
        ['Statut', statutLabel],
        ['Certificat emis', insc.certificatEmis ? 'Oui' : 'Non'],
      ];
      if (insc.noteFinale) {
        statutBody.push(['Note finale', `${insc.noteFinale} / 20`]);
      }
      tableOpts(y + 10, statutBody);

      // --- Footer ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(245, 245, 245);
      doc.rect(0, pageHeight - 25, 210, 25, 'F');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Document genere le ${new Date().toLocaleString('fr-TN')}`, 105, pageHeight - 15, { align: 'center' });
      doc.text(`Inscription N\u00B0 ${String(insc.id).padStart(4, '0')} \u2014 Centre de Formation`, 105, pageHeight - 9, { align: 'center' });

      // Save
      const filename = `inscription_${String(insc.id).padStart(4, '0')}_${stagiaire?.nom || 'stagiaire'}.pdf`;
      doc.save(filename);
      toast.success('PDF telecharge');
    } catch (err) {
      console.error('Erreur generation PDF:', err);
      toast.error('Erreur lors de la generation du PDF');
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

  if (!inscription) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Inscription non trouvée</h2>
          <Link href="/inscriptions" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href="/inscriptions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux inscriptions
      </Link>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Inscription — {inscription.stagiaire?.prenom} {inscription.stagiaire?.nom}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <Link
              href={`/inscriptions/${id}/modifier`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Modifier
            </Link>
            <button
              onClick={deleteInscription}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
            >
              Supprimer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b">
            <div>
              <h2 className="text-xl font-semibold mb-4">Stagiaire</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Nom complet</dt>
                  <dd className="font-medium">
                    {inscription.stagiaire?.prenom} {inscription.stagiaire?.nom}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd>{inscription.stagiaire?.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Téléphone</dt>
                  <dd>{inscription.stagiaire?.telephone || '—'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Session / Formation</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Formation</dt>
                  <dd className="font-medium">{inscription.session?.formation?.nom || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Session</dt>
                  <dd>{inscription.session?.nom || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Formateur principal</dt>
                  <dd>
                    {inscription.session?.formateur
                      ? `${inscription.session.formateur.prenom} ${inscription.session.formateur.nom}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Période</dt>
                  <dd>
                    {inscription.session?.dateDebut
                      ? new Date(inscription.session.dateDebut).toLocaleDateString('fr-TN')
                      : '—'}{' '}
                    →{' '}
                    {inscription.session?.dateFin
                      ? new Date(inscription.session.dateFin).toLocaleDateString('fr-TN')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Informations financières</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Montant total</p>
                <p className="text-xl font-bold">
                  {inscription.montantTotal?.toLocaleString('fr-TN')} TND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant payé</p>
                <p className="text-xl font-bold text-green-600">
                  {inscription.montantPaye?.toLocaleString('fr-TN') || '0'} TND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reste à payer</p>
                <p className="text-xl font-bold text-red-600">
                  {(
                    (inscription.montantTotal || 0) - (inscription.montantPaye || 0)
                  ).toLocaleString('fr-TN')}{' '}
                  TND
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Autres informations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Date d'inscription</p>
                <p className="font-medium">
                  {new Date(inscription.dateInscription).toLocaleString('fr-TN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <span
                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
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
              {inscription.noteFinale && (
                <div>
                  <p className="text-sm text-gray-500">Note finale</p>
                  <p className="font-medium">{inscription.noteFinale} / 20</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Certificat émis</p>
                <p className="font-medium">
                  {inscription.certificatEmis ? 'Oui' : 'Non'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/inscriptions" className="text-blue-600 hover:underline">
            ← Retour à la liste des inscriptions
          </Link>
        </div>
      </div>
    </Layout>
  );
}
