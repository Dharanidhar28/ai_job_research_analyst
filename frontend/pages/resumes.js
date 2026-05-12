import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import styles from "../styles/Dashboard.module.css";

export default function Resumes() {
	const [resumes, setResumes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		const fetchResumes = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Please login to view your resumes.");
				setLoading(false);
				return;
			}
			try {
				const res = await axios.get("http://localhost:8000/resumes", {
					headers: { Authorization: `Bearer ${token}` },
				});
				setResumes(res.data);
			} catch (err) {
				setError("Failed to fetch resumes.");
			} finally {
				setLoading(false);
			}
		};
		fetchResumes();
	}, []);

	const parseIt = async (id) => {
		const token = localStorage.getItem("token");
		setMsg("Parsing...");
		try {
			await axios.post(
				`http://localhost:8000/parse_resume/${id}`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setMsg("Parsed resume successfully!");
			// Refresh list
			const res = await axios.get("http://localhost:8000/resumes", {
				headers: { Authorization: `Bearer ${token}` },
			});
			setResumes(res.data);
		} catch (err) {
			setMsg(err.response?.data?.detail || err.message);
		}
	};

	const searchJobs = async (id) => {
		const token = localStorage.getItem("token");
		setMsg("Searching for jobs...");
		try {
			const res = await axios.get(
				`http://localhost:8000/jobs/search?resume_id=${id}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			localStorage.setItem("last_jobs", JSON.stringify(res.data));
			router.push("/jobs");
		} catch (err) {
			setMsg(err.response?.data?.detail || err.message);
		}
	};

	return (
		<Layout>
			<div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2>Your Resumes</h2>
				<a href="/upload" className="btn btn-primary">Upload New</a>
			</div>

			{msg && <div className="card" style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 500 }}>{msg}</div>}
			{error && <div className="card" style={{ marginBottom: '1.5rem', color: '#ef4444' }}>{error}</div>}

			{loading ? (
				<p>Loading resumes...</p>
			) : resumes.length === 0 ? (
				<div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
					<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You haven't uploaded any resumes yet.</p>
					<a href="/upload" className="btn btn-primary">Upload Your First Resume</a>
				</div>
			) : (
				<div className={styles.grid}>
					{resumes.map((r) => (
						<div key={r.id} className={`card ${styles.item}`}>
							<div className={styles.itemHeader}>
								<div>
									<h3 style={{ marginBottom: '0.25rem' }}>{r.filename}</h3>
									<p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Version {r.version}</p>
								</div>
								<span className={`${styles.badge} ${r.parsed ? styles.badgeSuccess : ''}`}>
									{r.parsed ? "Parsed" : "Pending"}
								</span>
							</div>
							
							<div className={styles.actions}>
								<button 
									onClick={() => parseIt(r.id)} 
									className="btn btn-outline"
									style={{ flex: 1, fontSize: '0.875rem' }}
									disabled={r.parsed}
								>
									{r.parsed ? "Re-parse" : "Parse Now"}
								</button>
								<button 
									onClick={() => searchJobs(r.id)} 
									className="btn btn-primary"
									style={{ flex: 1, fontSize: '0.875rem' }}
								>
									Search Jobs
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</Layout>
	);
}
