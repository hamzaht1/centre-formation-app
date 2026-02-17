import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  /**
   * Initialize auth state from localStorage
   */
  initialize: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        set({ token, user: JSON.parse(user), loading: false });
        // Verify token is still valid
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              set({ user: null, token: null, loading: false });
            }
            return res.json();
          })
          .then((data) => {
            if (data && data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              set({ user: data.user, loading: false });
            }
          })
          .catch(() => {
            set({ loading: false });
          });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur de connexion' };
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user });
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  },

  /**
   * Logout - clear token and user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  /**
   * Check if user has one of the specified roles
   * @param  {...string} roles
   * @returns {boolean}
   */
  hasRole: (...roles) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));

export default useAuthStore;
