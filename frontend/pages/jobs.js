import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import styles from "../styles/Dashboard.module.css";

export default function Jobs() {
	const [jobs, setJobs] = useState([]);

	useEffect(() => {
		const data = localStorage.getItem("last_jobs");
		if (data) setJobs(JSON.parse(data));
	}, []);

	return (
		<Layout>
			<div style={{ marginBottom: '2rem' }}>
				<h2>Job Results</h2>
				<p style={{ color: 'var(--text-muted)' }}>
					Showing {jobs.length} jobs matched based on your resume.
				</p>
			</div>

			{jobs.length === 0 ? (
				<div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
					<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No job results found. Try searching from the Resumes page.</p>
					<a href="/resumes" className="btn btn-primary">Go to Resumes</a>
				</div>
			) : (
				<div className={styles.grid}>
					{jobs.map((j, idx) => (
						<div key={idx} className={`card ${styles.item}`}>
							<div>
								<div className={styles.itemHeader}>
									<h3 style={{ marginBottom: '0.25rem' }}>{j.title}</h3>
									<span className={styles.badge}>{j.location}</span>
								</div>
								<p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>{j.company}</p>
								
								<div
									style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
									dangerouslySetInnerHTML={{
										__html: j.description || "",
									}}
								/>
							</div>
							
							<div className={styles.actions}>
								<a 
									href={j.redirect_url} 
									target="_blank" 
									rel="noreferrer" 
									className="btn btn-primary"
									style={{ width: '100%' }}
								>
									Apply Now
								</a>
							</div>
						</div>
					))}
				</div>
			)}
		</Layout>
	);
}
