import { useState } from "react";
import axios from "axios";

export default function Tailor() {
	const [resumeId, setResumeId] = useState("");
	const [jd, setJd] = useState("");
	const [result, setResult] = useState("");

	const submit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		try {
			const res = await axios.post(
				`http://localhost:8000/tailor/${resumeId}`,
				{ job_description: jd },
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setResult(res.data.tailored);
		} catch (err) {
			setResult(err.response?.data?.detail || err.message);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h2>Tailor Resume</h2>
			<form onSubmit={submit}>
				<div>
					<label>Resume ID</label>
					<input
						value={resumeId}
						onChange={(e) => setResumeId(e.target.value)}
					/>
				</div>
				<div>
					<label>Job Description</label>
					<textarea
						value={jd}
						onChange={(e) => setJd(e.target.value)}
						rows={8}
						cols={60}
					/>
				</div>
				<button type="submit">Tailor</button>
			</form>
			<pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
		</div>
	);
}
