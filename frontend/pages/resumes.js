import axios from "axios";
import { useEffect, useState } from "react";

export default function Resumes() {
	const [resumes, setResumes] = useState([]);
	const [msg, setMsg] = useState("");

	useEffect(() => {
		const t = async () => {
			const token = localStorage.getItem("token");
			if (!token) return;
			try {
				const res = await axios.get("http://localhost:8000/resumes", {
					headers: { Authorization: `Bearer ${token}` },
				});
				setResumes(res.data);
			} catch (err) {
				console.error(err);
			}
		};
		t();
	}, []);

	const parseIt = async (id) => {
		const token = localStorage.getItem("token");
		try {
			const res = await axios.post(
				`http://localhost:8000/parse_resume/${id}`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setMsg("Parsed resume id " + id);
		} catch (err) {
			setMsg(err.response?.data?.detail || err.message);
		}
	};

	const searchJobs = async (id) => {
		const token = localStorage.getItem("token");
		try {
			const res = await axios.get(
				`http://localhost:8000/jobs/search?resume_id=${id}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			// open jobs page with results in new tab using local storage
			localStorage.setItem("last_jobs", JSON.stringify(res.data));
			window.open("/jobs", "_blank");
		} catch (err) {
			setMsg(err.response?.data?.detail || err.message);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h2>Your Resumes</h2>
			<div>{msg}</div>
			<ul>
				{resumes.map((r) => (
					<li key={r.id}>
						{r.filename} (v{r.version}) - parsed: {r.parsed ? "yes" : "no"}
						<button onClick={() => parseIt(r.id)} style={{ marginLeft: 10 }}>
							Parse
						</button>
						<button onClick={() => searchJobs(r.id)} style={{ marginLeft: 10 }}>
							Search Jobs
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
