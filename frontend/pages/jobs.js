import { useEffect, useState } from "react";

export default function Jobs() {
	const [jobs, setJobs] = useState([]);

	useEffect(() => {
		const data = localStorage.getItem("last_jobs");
		if (data) setJobs(JSON.parse(data));
	}, []);

	return (
		<div style={{ padding: 20 }}>
			<h2>Job Results</h2>
			<ul>
				{jobs.map((j, idx) => (
					<li key={idx} style={{ marginBottom: 10 }}>
						<strong>{j.title}</strong> — {j.company} — {j.location}
						<div
							dangerouslySetInnerHTML={{
								__html: j.description ? j.description.substring(0, 300) : "",
							}}
						/>
						<div>
							<a href={j.redirect_url} target="_blank" rel="noreferrer">
								Apply
							</a>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
