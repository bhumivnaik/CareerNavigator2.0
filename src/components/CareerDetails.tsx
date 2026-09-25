import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Career } from "./Dashboard";
import CareerRoadmap from "../components/ui/CareerRoadmap"
// import { useAuth } from "../context/authContext";
import "../css/careerCard.css";

function CareerDetails() {
    const { careerId } = useParams();
    const navigate = useNavigate();
    const [career, setCareer] = useState<Career | null>(null);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);


    const [careerAdded, setCareerAdded] = useState(false);
    const [addingCareer, setAddingCareer] = useState(false);

    useEffect(() => {
        async function loadDetails() {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const details = await axios.get(`/api/careers/${careerId}`, { headers });
                console.log("CAREER DETAILS:", details.data);
                setCareer(details.data);
            } catch (error) {
                console.error("USER SKILLS API ERROR:", error);
                throw error;
            }
        }
        loadDetails();
    },
        [careerId]);

    useEffect(() => {

        if (!career) return;

        setAnimatedPercentage(0);

        const duration = 1000;
        const startTime = performance.now();

        function animate(currentTime: number) {

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentPercentage = Math.round(
                progress * career?.match_percentage
            );

            setAnimatedPercentage(currentPercentage);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);

    }, [career]);

    useEffect(() => {
        async function checkCareerSelection() {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "/api/careers/paths",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log("USER CAREER PATHS:", response.data);

                const alreadyAdded = response.data.some(
                    (item: any) =>
                        Number(item.career_id) === Number(careerId)
                );

                setCareerAdded(alreadyAdded);

            } catch (error) {
                console.error("CHECK CAREER SELECTION ERROR:", error);
            }
        }

        if (careerId) {
            checkCareerSelection();
        }
    }, [careerId]);

    async function addCareerToPath() {

        if (!career) return;

        try {

            setAddingCareer(true);

            const token = localStorage.getItem("token");

            await axios.post(
                "/api/careers/paths",
                {
                    career_id: career.career_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCareerAdded(true);

        } catch (error: any) {

            console.error(
                "ADD CAREER TO PATH ERROR:",
                error
            );

            if (error.response?.status === 409) {

                setCareerAdded(true);

            } else {

                alert("Failed to add career to your career path.");

            }

        } finally {

            setAddingCareer(false);

        }
    }

    return (
        <div className="dashboard-layout">
            <Navbar />

            <main className="career-details-content">
                <button className="career-back-button" onClick={() => navigate("/careers")}>
                    ←
                </button>

                <div className="career-details-header">
                    <div>
                        <p className="career-category2">{career?.category.toUpperCase()}</p>
                        <h1 className="career-title2">{career?.career_name}</h1>
                        <p className="career-details-desc">{career?.description}</p>
                        <br /><br />
                        <h5>Skills for this Career</h5>
                        {career?.missing_skills.map(
                            (skill) => (
                                <span className="skilltag" key={skill}>{skill}</span>
                            )
                        )}
                        {career?.matched_skills.map(
                            (skill) => (
                                <span className="skilltag" key={skill}>{skill}</span>
                            )
                        )}
                    </div>

                    <div className="career-match-box">
                        <span>Your Match</span>
                        <div className="match-circle"
                            style={{
                                background: `conic-gradient( var(--success2) ${animatedPercentage}%, var(--primary-light2) ${animatedPercentage}% 100%)`
                            }}>
                            <div className="match-circle-inner">
                                <strong>{animatedPercentage}%</strong>
                            </div>
                        </div>
                        <button
                            className={careerAdded ? "goal current" : "goal"}
                            onClick={addCareerToPath}
                            disabled={addingCareer || careerAdded}
                        >
                            {addingCareer
                                ? "Adding..."
                                : careerAdded
                                    ? "✓ Added to Career Path"
                                    : "Add to Career Path"
                            }
                        </button>

                    </div>
                </div>

                <section className="career-skills-section">
                    <div className="section-heading2">
                        <div>
                            <h2> Skills for this Career </h2>
                            <p>  See how your current skills match this career </p>
                        </div>
                    </div>

                    <div className="skills-status-grid">
                        <div className="skill-status-card matched">
                            <div className="skill-status-heading">
                                <span className="skill-status-icon"> ✓ </span>
                                <div>
                                    <h3> Matched Skills </h3>
                                    <p> Skills you already have </p>
                                </div>
                            </div>

                            <div className="skill-list">
                                {career?.matched_skills.length > 0 ? (
                                    career?.matched_skills.map(
                                        (skill) => (
                                            <span
                                                className="skill-tag"
                                                key={skill}
                                            >
                                                ✓ {skill}
                                            </span>
                                        )
                                    )

                                ) : (

                                    <p className="no-skills">
                                        No matched skills yet
                                    </p>

                                )}

                            </div>

                        </div>

                        <div className="skill-status-card missing">

                            <div className="skill-status-heading">

                                <span className="skill-status-icon">
                                    !
                                </span>

                                <div>

                                    <h3>
                                        Missing Skills
                                    </h3>

                                    <p>
                                        Skills you need to develop
                                    </p>

                                </div>

                            </div>


                            <div className="skill-list">

                                {career?.missing_skills.length > 0 ? (

                                    career?.missing_skills.map(
                                        (skill) => (
                                            <span
                                                className="skill-tag"
                                                key={skill}
                                            >
                                                ○ {skill}
                                            </span>
                                        )
                                    )

                                ) : (

                                    <p className="no-skills">
                                        You have all required skills!
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>

                </section>

                <section className="career-roadmap-section">
                    <div className="section-heading2">
                        <div>
                            <h2> Career Roadmap </h2>
                            <p> Follow a structured path to reach this career </p>
                        </div>
                    </div>
                    <div className="roadmap-placeholder">
                        {career && (<CareerRoadmap careerId={career.career_id} />)}
                    </div>
                </section>

            </main>
        </div>
    );
}

export default CareerDetails;
