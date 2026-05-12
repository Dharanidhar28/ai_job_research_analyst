import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ padding: '2rem 0' }}>
        <div className="container">
          {children}
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div className="container">
          &copy; {new Date().getFullYear()} JobResearchAI. All rights reserved.
        </div>
      </footer>
    </>
  );
}
