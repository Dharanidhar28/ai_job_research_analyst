import axios from "axios";
import { useState } from "react";

export default function Upload() {
	const [file, setFile] = useState(null);
	const [msg, setMsg] = useState("");

	const submit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (!token) {
			alert("Please login first");
			return;
		}
		const fd = new FormData();
		fd.append("file", file);
		try {
			const res = await axios.post("http://localhost:8000/upload_resume", fd, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${token}`,
				},
			});
			setMsg("Uploaded: " + res.data.filename);
		} catch (err) {
			setMsg(err.response?.data?.detail || err.message);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h2>Upload Resume</h2>
			<form onSubmit={submit}>
				<input type="file" onChange={(e) => setFile(e.target.files[0])} />
				<button type="submit">Upload</button>
			</form>
			<div>{msg}</div>
		</div>
	);
}
