import { useRouter } from 'next/router';
import useAuthStore from '../../lib/useAuth';

export default function Header({ toggleSidebar }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700',
    formateur: 'bg-blue-100 text-blue-700',
    secretaire: 'bg-green-100 text-green-700',
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 focus:outline-none lg:hidden"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="relative mx-4 lg:mx-0">
          <input
            className="w-full lg:w-96 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
            type="text"
            placeholder="Rechercher..."
          />
          <span className="absolute left-3 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadgeColor[user.role] || 'bg-gray-100 text-gray-700'}`}>
              {user.role}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {user.prenom}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
              title="Se deconnecter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
