import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./ui/Navbar";

type ComparedCareer = {
    career_id: number;
    career_name: string;
    description: string;
    category: string;
    match_percentage: number;
    matched_count: number;
    total_skills: number;
    matched_skills: string[];
    missing_skills: string[];
    learning_requirements: string[];
    roadmap: {
        skill_id: number;
        skill_name: string;
        skill_level: string;
        roadmap_stage: string;
        sequence_order: number;
        status: string;
    }[];
};

const CareerCompare = () => {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [careers, setCareers] = useState<ComparedCareer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function loadComparison() {

            try {

                const ids = searchParams.get("ids");

                if (!ids) {
                    alert("No careers selected for comparison.");
                    navigate("/careers");
                    return;
                }

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `/api/careers/compare?ids=${ids}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log("CAREER COMPARISON:", response.data);

                setCareers(response.data);

            } catch (error) {

                console.error(
                    "CAREER COMPARISON ERROR:",
                    error
                );

                alert("Failed to load career comparison.");

            } finally {

                setLoading(false);

            }
        }

        loadComparison();

    }, [searchParams, navigate]);


    if (loading) {

        return (
            <div className="dashboard-loading">
                Loading comparison...
            </div>
        );

    }


    return (

        <div className="dashboard-layout">

            <Navbar />

            <main className="dashboard-content">

                {/* HEADER */}

                <div className="careers-page-header">

                    <div>

                        <p className="dashboard-label">
                            CAREER COMPARISON
                        </p>

                        <h1>
                            Compare Career Options
                        </h1>

                        <p className="careers-subtitle">
                            Compare your current skills, missing skills,
                            and learning requirements for each career.
                        </p>

                    </div>

                    <button
                        onClick={() => navigate("/careers")}
                        style={{
                            padding: "12px 20px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "var(--primary)",
                            color: "white",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        ← Back to Careers
                    </button>

                </div>


                {/* COMPARISON */}

                {/* COMPARISON */}

                <div
                    style={{
                        marginTop: "30px",
                        backgroundColor: "var(--primary-dark2)",
                        borderRadius: "20px",
                        padding: "20px",
                        overflowX: "auto"
                    }}
                >

                    <div
                        style={{
                            minWidth: `${Math.max(careers.length, 2) * 280}px`
                        }}
                    >

                        {/* CAREER NAMES */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div />

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "20px",
                                        borderRadius: "12px",
                                        backgroundColor: "rgba(229, 214, 249, 0.3)",
                                        textAlign: "center"
                                    }}
                                >

                                    <h2
                                        style={{
                                            margin: 0,
                                            color: "white",
                                            fontSize: "20px"
                                        }}
                                    >
                                        {career.career_name}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-block",
                                            marginTop: "8px",
                                            padding: "5px 10px",
                                            borderRadius: "20px",
                                            backgroundColor:
                                                "rgba(255,255,255,0.12)",
                                            color: "var(--primary-light)",
                                            fontSize: "11px"
                                        }}
                                    >
                                        {career.category}
                                    </span>

                                </div>
                            ))}

                        </div>


                        {/* MATCH LEVEL */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Match Level
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px",
                                        textAlign: "center",
                                        color: "white"
                                    }}
                                >

                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: 700
                                        }}
                                    >
                                        {career.match_percentage}%
                                    </div>

                                    <span
                                        style={{
                                            fontSize: "11px",
                                            opacity: 0.7
                                        }}
                                    >
                                        profile match
                                    </span>

                                </div>
                            ))}

                        </div>


                        {/* SKILLS AVAILABLE */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Skills Available
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px",
                                        color: "white"
                                    }}
                                >

                                    <strong>
                                        {career.matched_count}
                                    </strong>

                                    {" "}of{" "}

                                    <strong>
                                        {career.total_skills}
                                    </strong>

                                    <div
                                        style={{
                                            marginTop: "8px",
                                            fontSize: "11px",
                                            opacity: 0.7
                                        }}
                                    >
                                        required skills already available
                                    </div>

                                </div>
                            ))}

                        </div>


                        {/* SKILLS YOU HAVE */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Skills You Have
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px"
                                    }}
                                >

                                    {career.matched_skills.length > 0 ? (

                                        career.matched_skills.map(
                                            (skill, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "5px 8px",
                                                        margin: "3px",
                                                        borderRadius: "15px",
                                                        backgroundColor:
                                                            "rgba(255,255,255,0.12)",
                                                        color: "white",
                                                        fontSize: "10px"
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            )
                                        )

                                    ) : (

                                        <span
                                            style={{
                                                color: "white",
                                                fontSize: "12px",
                                                opacity: 0.6
                                            }}
                                        >
                                            No matching skills
                                        </span>

                                    )}

                                </div>
                            ))}

                        </div>


                        {/* SKILLS MISSING */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Skills Missing
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px"
                                    }}
                                >

                                    {career.missing_skills.length > 0 ? (

                                        career.missing_skills.map(
                                            (skill, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "5px 8px",
                                                        margin: "3px",
                                                        borderRadius: "15px",
                                                        border:
                                                            "1px solid rgba(255,255,255,0.2)",
                                                        color: "white",
                                                        fontSize: "10px"
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            )
                                        )

                                    ) : (

                                        <span
                                            style={{
                                                color: "white",
                                                fontSize: "12px",
                                                opacity: 0.6
                                            }}
                                        >
                                            No missing skills
                                        </span>

                                    )}

                                </div>
                            ))}

                        </div>


                        {/* LEARNING REQUIREMENTS */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px",
                                marginBottom: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Learning Requirements
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px",
                                        color: "white",
                                        fontSize: "12px"
                                    }}
                                >

                                    {career.learning_requirements.length > 0 ? (

                                        <ul
                                            style={{
                                                margin: 0,
                                                paddingLeft: "18px",
                                                lineHeight: "1.8"
                                            }}
                                        >
                                            {career.learning_requirements.map(
                                                (skill, index) => (
                                                    <li key={index}>
                                                        Learn {skill}
                                                    </li>
                                                )
                                            )}
                                        </ul>

                                    ) : (

                                        <span style={{ opacity: 0.6 }}>
                                            No additional learning required
                                        </span>

                                    )}

                                </div>
                            ))}

                        </div>


                        {/* RECOMMENDED PATHWAY */}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    `200px repeat(${careers.length}, 1fr)`,
                                gap: "10px"
                            }}
                        >

                            <div
                                style={{
                                    padding: "18px",
                                    color: "var(--primary-light)",
                                    fontWeight: 600
                                }}
                            >
                                Recommended Pathway
                            </div>

                            {careers.map((career) => (
                                <div
                                    key={career.career_id}
                                    style={{
                                        padding: "18px",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        borderRadius: "10px",
                                        color: "white",
                                        fontSize: "12px"
                                    }}
                                >

                                    {career.roadmap.length > 0 ? (

                                        <ol
                                            style={{
                                                margin: 0,
                                                paddingLeft: "18px",
                                                lineHeight: "1.8"
                                            }}
                                        >

                                            {career.roadmap
                                                .filter(
                                                    (item, index, self) =>
                                                        self.findIndex(
                                                            x =>
                                                                x.skill_id ===
                                                                item.skill_id
                                                        ) === index
                                                )
                                                .map((item) => (

                                                    <li key={item.skill_id}>
                                                        {item.skill_name}
                                                    </li>

                                                ))}

                                        </ol>

                                    ) : (

                                        <span style={{ opacity: 0.6 }}>
                                            No pathway information available
                                        </span>

                                    )}

                                </div>
                            ))}

                        </div>

                    </div>

                </div>


                {/* ACTION */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "25px"
                    }}
                >

                    <button
                        onClick={() => navigate("/careers")}
                        style={{
                            padding: "12px 25px",
                            border: "none",
                            borderRadius: "10px",
                            backgroundColor: "var(--primary)",
                            color: "white",
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        ← Compare Different Careers
                    </button>

                </div>

            </main>

        </div>

    );
};

export default CareerCompare;
