import axios from "axios";
import { useState } from "react";

export default function Register() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [token, setToken] = useState(null);

	const submit = async (e) => {
		e.preventDefault();
		try {
			const res = await axios.post("http://localhost:8000/auth/register", {
				email,
				password,
			});
			setToken(res.data.access_token);
		} catch (err) {
			alert(err.response?.data?.detail || err.message);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h2>Register</h2>
			<div>
				<a href="http://localhost:8000/auth/login/google">
					<button>Register with Google</button>
				</a>
				<a
					href="http://localhost:8000/auth/login/linkedin"
					style={{ marginLeft: 10 }}
				>
					<button>Register with LinkedIn</button>
				</a>
			</div>
			<form onSubmit={submit}>
				<div>
					<label>Email</label>
					<input value={email} onChange={(e) => setEmail(e.target.value)} />
				</div>
				<div>
					<label>Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<button type="submit">Register</button>
			</form>
			{token && (
				<div>
					Token saved (copy): <code>{token}</code>
				</div>
			)}
		</div>
	);
}
