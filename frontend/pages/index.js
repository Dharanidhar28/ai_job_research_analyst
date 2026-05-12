import Layout from "../components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function Home() {
	const router = useRouter();

	const handleBrowseJobs = (e) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (token) {
			router.push("/jobs");
		} else {
			window.location.href = "http://localhost:8000/auth/login/linkedin";
		}
	};

	return (
		<Layout>
			<section className={styles.hero}>
				<div className="container">
					<h1>Accelerate Your Job Search with AI</h1>
					<p>Upload your resume, find matching jobs instantly, and tailor your application for every role with our advanced parsing and AI-driven insights.</p>
					<div className={styles.cta}>
						<Link href="/upload" className="btn btn-primary">
							Get Started
						</Link>
						<button onClick={handleBrowseJobs} className="btn btn-outline">
							Browse Jobs
						</button>
					</div>
				</div>
			</section>

			<section className={styles.features}>
				<div className={`card ${styles.featureCard}`}>
					<div className={styles.featureIcon}>1</div>
					<h3>Upload & Parse</h3>
					<p>Our AI extracts your skills and experience from your resume with high precision.</p>
				</div>
				<div className={`card ${styles.featureCard}`}>
					<div className={styles.featureIcon}>2</div>
					<h3>Smart Job Search</h3>
					<p>Instantly find jobs that match your unique profile across multiple platforms.</p>
				</div>
				<div className={`card ${styles.featureCard}`}>
					<div className={styles.featureIcon}>3</div>
					<h3>Tailor with AI</h3>
					<p>Generate optimized content for your applications to stand out to recruiters.</p>
				</div>
			</section>
		</Layout>
	);
}
