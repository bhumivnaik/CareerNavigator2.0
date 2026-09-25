import React from 'react'
import Navbar from './ui/Navbar'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Career } from './Dashboard';
import { useEffect, useState } from 'react';
import CareerCard from './ui/careerCard';
import { useAuth } from '../context/authContext';

const Career = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);

    const [compareMode, setCompareMode] = useState(false);
    const [selectedCareers, setSelectedCareers] = useState<number[]>([]);

    useEffect(() => {
        async function loadCareer() {
            try {
                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                try {
                    const careersResponse = await axios.get(
                        "/api/careers/recommended",
                        { headers }
                    );

                    console.log("RECOMMENDED CAREERS:", careersResponse.data);
                    setCareers(careersResponse.data);

                } catch (error) {
                    console.error("CAREERS API ERROR:", error);
                    throw error;
                }

            } catch (error) {
                console.error("CAREEER DASHBOARD ERROR:", error);
                alert("Failed to load career dashboard");

            } finally {
                setLoading(false);
            }
        }

        loadCareer();

    }, []);

    function handleCompareToggle(careerId: number) {
        setSelectedCareers((prev) => {

            // Remove career if already selected
            if (prev.includes(careerId)) {
                return prev.filter((id) => id !== careerId);
            }

            // Maximum 3 careers
            if (prev.length >= 3) {
                alert("You can compare a maximum of 3 careers.");
                return prev;
            }

            // Add career
            return [...prev, careerId];
        });
    }

    function handleCompareMode() {
        setCompareMode((prev) => !prev);
        setSelectedCareers([]);
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-layout">

            <Navbar />

            <main className="dashboard-content">

                {/* PAGE HEADER */}
                <div className="careers-page-header">

                    <div>
                        <p className="dashboard-label">
                            CAREER DISCOVERY
                        </p>

                        <h1>
                            Explore Careers
                        </h1>

                        <p className="careers-subtitle">
                            Explore career paths and see how well your
                            current skills match each one.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px"
                        }}
                    >

                        {/* COMPARE CAREERS BUTTON */}
                        <button
                            onClick={handleCompareMode}
                            style={{
                                padding: "12px 20px",
                                borderRadius: "10px",
                                border: "none",
                                backgroundColor: "var(--primary-dark)",
                                color: "white",
                                fontFamily: "Poppins, sans-serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            {compareMode
                                ? "Cancel Comparison"
                                : "Compare Careers"}
                        </button>

                        {/* CAREER COUNT */}
                        <div className="career-count">
                            <strong>
                                {careers.length}
                            </strong>

                            <span>
                                Career Paths
                            </span>
                        </div>

                    </div>

                </div>

                {/* COMPARISON INSTRUCTION */}
                {compareMode && (
                    <div
                        className="compare-instruction"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                            marginBottom: "5px"
                        }}
                    >
                        <span>
                            Select up to 3 careers to compare
                        </span>

                        <strong>
                            {selectedCareers.length} selected
                        </strong>
                    </div>
                )}

                {/* RECOMMENDED PATHWAYS */}
                <div
                    style={{
                        backgroundColor: "#d8cfee",
                        borderRadius: "20px",
                        padding: "15px"
                    }}
                >

                    <div
                        style={{
                            color: "var(--primary-dark2)",
                            padding: "15px",
                            fontWeight: "600",
                            borderRadius: "10px"
                        }}
                    >
                        Recommended Pathways
                    </div>

                    <div className="career-grid">

                        {careers.map((career) => (

                            career.match_percentage > 10 && (

                                <CareerCard
                                    key={career.career_id}
                                    career={career}
                                    isSelected={selectedCareers.includes(
                                        career.career_id
                                    )}
                                    onCompareToggle={() =>
                                        handleCompareToggle(
                                            career.career_id
                                        )
                                    }
                                    compareMode={compareMode}
                                />

                            )

                        ))}

                    </div>

                </div>

                <br />


                <hr />

                {/* LEAST RECOMMENDED PATHWAYS */}
                <div
                    style={{
                        backgroundColor: "#d8cfee",
                        borderRadius: "20px",
                        padding: "15px",
                        marginTop: "50px"
                    }}
                >

                    <div
                        style={{
                            color: "var(--primary-dark2)",
                            fontWeight: "600",
                            padding: "15px",
                            borderRadius: "10px"
                        }}
                    >
                        Least Recommended Pathways
                    </div>

                    <div className="career-grid">

                        {careers.map((career) => (

                            career.match_percentage < 10 && (

                                <CareerCard
                                    key={career.career_id}
                                    career={career}
                                    isSelected={selectedCareers.includes(
                                        career.career_id
                                    )}
                                    onCompareToggle={() =>
                                        handleCompareToggle(
                                            career.career_id
                                        )
                                    }
                                    compareMode={compareMode}
                                />

                            )

                        ))}

                    </div>

                </div>

                {/* COMPARISON BAR */}
                {compareMode && selectedCareers.length > 0 && (

                    <div className="compare-bar">

                        <div className="compare-bar-info">

                            <strong>
                                {selectedCareers.length} career
                                {selectedCareers.length > 1 ? "s" : ""} selected
                            </strong>

                            <span>
                                {selectedCareers.length < 2
                                    ? "Select at least 2 careers to compare"
                                    : "Ready to compare your selected careers"}
                            </span>

                        </div>

                        <button
                            className="compare-bar-button"
                            disabled={selectedCareers.length < 2}
                            onClick={() =>
                                navigate(
                                    `/careers/compare?ids=${selectedCareers.join(",")}`
                                )
                            }
                        >
                            Compare Selected →
                        </button>

                    </div>

                )}

            </main>

        </div>
    )
}

export default Career
