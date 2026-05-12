import axios from "axios";
import { useState } from "react";
import Layout from "../components/Layout";

export default function Upload() {
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");

	const submit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (!token) {
			setError("Please login first to upload resumes.");
			return;
		}
		if (!file) {
			setError("Please select a file to upload.");
			return;
		}

		setLoading(true);
		setError("");
		setMsg("");

		const fd = new FormData();
		fd.append("file", file);
		try {
			const res = await axios.post("http://localhost:8000/upload_resume", fd, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${token}`,
				},
			});
			setMsg("Successfully uploaded: " + res.data.filename);
			setFile(null);
		} catch (err) {
			setError(err.response?.data?.detail || err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Layout>
			<div style={{ maxWidth: 600, margin: '0 auto' }}>
				<div className="card">
					<h2>Upload Resume</h2>
					<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
						Select your resume (PDF or DOCX) to start the analysis process.
					</p>

					<form onSubmit={submit}>
						<div className="form-group">
							<div style={{ 
								border: '2px dashed var(--border)', 
								borderRadius: 'var(--radius)', 
								padding: '2rem', 
								textAlign: 'center',
								background: file ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
								borderColor: file ? 'var(--secondary)' : 'var(--border)'
							}}>
								<input 
									type="file" 
									onChange={(e) => setFile(e.target.files[0])} 
									style={{ display: 'none' }}
									id="resume-upload"
								/>
								<label htmlFor="resume-upload" style={{ cursor: 'pointer' }}>
									{file ? (
										<span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{file.name} selected</span>
									) : (
										<>
											<p style={{ fontWeight: 600 }}>Click to select a file</p>
											<p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>PDF, DOCX up to 5MB</p>
										</>
									)}
								</label>
							</div>
						</div>
						
						{error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
						{msg && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>}

						<button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
							{loading ? "Uploading..." : "Upload Resume"}
						</button>
					</form>
				</div>
			</div>
		</Layout>
	);
}
