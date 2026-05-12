import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage
    const localToken = localStorage.getItem('token');
    
    // Check for token in URL query params (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setIsLoggedIn(true);
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    } else if (localToken) {
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const isActive = (path) => router.pathname === path;

  return (
    <nav className={styles.nav}>
      <div className="container">
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            JobResearch<span>AI</span>
          </Link>
          <div className={styles.links}>
            <Link href="/jobs" className={isActive('/jobs') ? styles.active : ''}>Jobs</Link>
            <Link href="/resumes" className={isActive('/resumes') ? styles.active : ''}>Resumes</Link>
            <Link href="/upload" className={isActive('/upload') ? styles.active : ''}>Upload</Link>
            <Link href="/tailor" className={isActive('/tailor') ? styles.active : ''}>Tailor</Link>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn btn-outline">Logout</button>
            ) : (
              <Link href="/login" className={`btn ${isActive('/login') ? 'btn-primary' : 'btn-outline'}`}>Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
