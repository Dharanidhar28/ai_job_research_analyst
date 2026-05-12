import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Auth.module.css";

export default function Register() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const submit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post("http://localhost:8000/auth/register", {
				email,
				password,
			});
			setSuccess(true);
		} catch (err) {
			alert(err.response?.data?.detail || err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Layout>
			<div className={styles.wrapper}>
				<div className="card">
					<h2 className={styles.title}>Create Account</h2>
					
					<div className={styles.socials}>
						<a href="http://localhost:8000/auth/login/google" className={`btn btn-outline ${styles.socialBtn}`}>
							<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
							</svg>
							Google
						</a>
						<a href="http://localhost:8000/auth/login/linkedin" className={`btn btn-outline ${styles.socialBtn}`}>
							<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5"/>
							</svg>
							LinkedIn
						</a>
					</div>

					<div className={styles.divider}>or register with email</div>

					{success ? (
						<div style={{ textAlign: 'center' }}>
							<p style={{ marginBottom: '1.5rem', color: 'var(--secondary)', fontWeight: 600 }}>Account created successfully!</p>
							<Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
								Go to Login
							</Link>
						</div>
					) : (
						<form onSubmit={submit}>
							<div className="form-group">
								<label className="form-label">Email Address</label>
								<input 
									className="form-input"
									type="email"
									placeholder="you@example.com"
									value={email} 
									onChange={(e) => setEmail(e.target.value)} 
									required
								/>
							</div>
							<div className="form-group">
								<label className="form-label">Password</label>
								<input
									className="form-input"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
								{loading ? "Creating account..." : "Register"}
							</button>
						</form>
					)}

					<div className={styles.footer}>
						Already have an account? <Link href="/login">Sign in</Link>
					</div>
				</div>
			</div>
		</Layout>
	);
}
