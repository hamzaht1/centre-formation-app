import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import toast from 'react-hot-toast';
import fetchWithAuth from '../../lib/fetchWithAuth';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'secretaire',
  });
  const [formateurs, setFormateurs] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchFormateurs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth('/api/users?limit=100');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs');
    }
    setLoading(false);
  };

  const fetchFormateurs = async () => {
    try {
      const res = await fetchWithAuth('/api/formateurs?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      setFormateurs(data.data || []);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const body = { ...formData };
      if (editingUser && !body.password) {
        delete body.password;
      }

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erreur');
        return;
      }

      toast.success(editingUser ? 'Utilisateur modifié' : 'Utilisateur créé');
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: '',
      role: user.role,
      formateurId: user.formateurId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Supprimer l'utilisateur ${user.prenom} ${user.nom} ?`)) return;

    try {
      const res = await fetchWithAuth(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
        return;
      }
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ nom: '', prenom: '', email: '', password: '', role: 'secretaire' });
  };

  const roleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      formateur: 'bg-blue-100 text-blue-800',
      secretaire: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const statutBadge = (statut) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {statut}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-gray-500">Gestion des comptes utilisateurs</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un utilisateur
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Derniere connexion</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">{roleBadge(user.role)}</td>
                    <td className="px-6 py-4">{statutBadge(user.statut)}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucun utilisateur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  {...(!editingUser ? { required: true } : {})}
                  minLength={editingUser ? 0 : 6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="formateur">Formateur</option>
                  <option value="secretaire">Secretaire</option>
                </select>
              </div>

              {formData.role === 'formateur' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lier a un formateur</label>
                  <select
                    value={formData.formateurId || ''}
                    onChange={(e) => setFormData({ ...formData, formateurId: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Aucun --</option>
                    {formateurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.prenom} {f.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingUser ? 'Modifier' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
