import { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import styles from "../styles/Dashboard.module.css";

export default function Tailor() {
	const [resumeId, setResumeId] = useState("");
	const [jd, setJd] = useState("");
	const [result, setResult] = useState("");
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);

	const submit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (!token) {
			alert("Please login first");
			return;
		}
		setLoading(true);
		setResult("");
		try {
			const res = await axios.post(
				`http://localhost:8000/tailor/${resumeId}`,
				{ job_description: jd },
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setResult(res.data.tailored);
		} catch (err) {
			setResult(err.response?.data?.detail || err.message);
		} finally {
			setLoading(false);
		}
	};

	const download = async (format) => {
		const token = localStorage.getItem("token");
		setExporting(true);
		try {
			const res = await axios.post(
				`http://localhost:8000/export/${format}`,
				{ content: result, filename: `tailored_resume.${format}` },
				{ 
					headers: { Authorization: `Bearer ${token}` },
					responseType: 'blob'
				}
			);
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `tailored_resume.${format}`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (err) {
			alert("Export failed: " + err.message);
		} finally {
			setExporting(false);
		}
	};

	return (
		<Layout>
			<div style={{ maxWidth: 800, margin: '0 auto' }}>
				<h2>Tailor Your Resume</h2>
				<p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
					Optimize your resume for a specific job description using AI.
				</p>

				<div className="card">
					<form onSubmit={submit}>
						<div className="form-group">
							<label className="form-label">Resume ID</label>
							<input
								className="form-input"
								placeholder="e.g. 1"
								value={resumeId}
								onChange={(e) => setResumeId(e.target.value)}
								required
							/>
							<p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
								You can find the ID on the <a href="/resumes" style={{ color: 'var(--primary)' }}>Resumes</a> page.
							</p>
						</div>
						<div className="form-group">
							<label className="form-label">Job Description</label>
							<textarea
								className="form-input"
								placeholder="Paste the job description here..."
								value={jd}
								onChange={(e) => setJd(e.target.value)}
								rows={10}
								required
							/>
						</div>
						<button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
							{loading ? "Generating Tailored Content..." : "Tailor Resume"}
						</button>
					</form>

					{result && (
						<>
							<div className={styles.resultArea}>
								<div style={{ fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
									AI-Tailored Content
								</div>
								{result}
							</div>
							
							<div style={{ marginTop: '2rem' }}>
								<p style={{ fontWeight: 600, marginBottom: '1rem' }}>Download tailored resume:</p>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
									<button 
										onClick={() => download('pdf')} 
										className="btn btn-outline"
										disabled={exporting}
									>
										{exporting ? "Preparing..." : "Download PDF"}
									</button>
									<button 
										onClick={() => download('docx')} 
										className="btn btn-outline"
										disabled={exporting}
									>
										{exporting ? "Preparing..." : "Download Word (.docx)"}
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</Layout>
	);
}
