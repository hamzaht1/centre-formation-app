import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../lib/useAuth';

const PUBLIC_PAGES = ['/login', '/forgot-password'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PAGES.includes(router.pathname)) {
      router.replace('/login');
    }
  }, [loading, user, router.pathname]);

  // Public pages - render without auth check
  if (PUBLIC_PAGES.includes(router.pathname)) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - don't render (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}

export default MyApp;
