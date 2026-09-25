import { useEffect, useState } from "react";
import axios from "axios";

type PathwaySkill = {
    skill_id: number;
    skill_name: string;
    category: string;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    roadmap_stage: number;
    sequence_order: number;
    priority: "High" | "Medium" | "Low";

    description: string | null;
    importance_reason: string | null;
    learning_resources: string | null;
    suggested_projects: string | null;
    suggested_courses: string | null;
    certifications: string | null;
    estimated_progression: string | null;
    related_roles: string | null;
};

type PersonalizedPathwayProps = {
    careerId: number;
};

function PersonalizedPathway({
    careerId
}: PersonalizedPathwayProps) {

    const [skills, setSkills] = useState<PathwaySkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSkill, setExpandedSkill] = useState<number | null>(null);

    useEffect(() => {

        async function loadPathway() {

            try {

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `/api/careers/${careerId}/pathway`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setSkills(response.data);

            } catch (error) {

                console.error(
                    "PERSONALIZED PATHWAY ERROR:",
                    error
                );

            } finally {

                setLoading(false);

            }
        }

        loadPathway();

    }, [careerId]);


    if (loading) {

        return (
            <section className="personalized-pathway-section">

                <div className="section-heading">

                    <div>

                        <p className="dashboard-label">
                            PERSONALIZED PATHWAY
                        </p>

                        <h2>
                            Your Learning Recommendations
                        </h2>

                    </div>

                </div>

                <div className="pathway-loading">
                    Loading personalized recommendations...
                </div>

            </section>
        );
    }


    if (skills.length === 0) {

        return (
            <section className="personalized-pathway-section">

                <div className="section-heading">

                    <div>

                        <p className="dashboard-label">
                            PERSONALIZED PATHWAY
                        </p>

                        <h2>
                            Your Learning Recommendations
                        </h2>

                    </div>

                </div>

                <div className="pathway-empty">

                    <div className="pathway-empty-icon">
                        ✓
                    </div>

                    <h3>
                        You're up to date
                    </h3>

                    <p>
                        There are currently no missing skills
                        requiring a personalized learning pathway.
                    </p>

                </div>

            </section>
        );
    }


    return (

        <section className="personalized-pathway-section">

            <div className="section-heading">

                <div>

                    <p className="dashboard-label">
                        PERSONALIZED PATHWAY
                    </p>

                    <h2>
                        What You Should Learn Next
                    </h2>

                    <p className="pathway-subtitle">
                        Personalized recommendations for the
                        skills you still need for your career goal.
                    </p>

                </div>

            </div>


            <div className="personalized-pathway-list">

                {skills.map((skill, index) => {

                    const isExpanded =
                        expandedSkill === skill.skill_id;

                    return (

                        <div
                            className={`pathway-skill-card ${
                                isExpanded
                                    ? "pathway-skill-expanded"
                                    : ""
                            }`}
                            key={skill.skill_id}
                        >

                            <button
                                className="pathway-skill-header"
                                onClick={() =>
                                    setExpandedSkill(
                                        isExpanded
                                            ? null
                                            : skill.skill_id
                                    )
                                }
                            >

                                <div className="pathway-skill-number">
                                    {index + 1}
                                </div>


                                <div className="pathway-skill-main">

                                    <div className="pathway-skill-title">

                                        <h3>
                                            {skill.skill_name}
                                        </h3>

                                        <span
                                            className={`skill-priority priority-${(
                                                skill.priority || "Medium"
                                            ).toLowerCase()}`}
                                        >
                                            {skill.priority || "Medium"} Priority
                                        </span>

                                    </div>

                                    <p>
                                        Stage {skill.roadmap_stage}
                                        {" • "}
                                        {skill.skill_level}
                                    </p>

                                </div>


                                <div className="pathway-expand-icon">
                                    {isExpanded ? "−" : "+"}
                                </div>

                            </button>


                            {isExpanded && (

                                <div className="pathway-skill-content">

                                    {skill.description && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Skill Description
                                            </h4>

                                            <p>
                                                {skill.description}
                                            </p>

                                        </div>
                                    )}


                                    {skill.importance_reason && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Why This Skill Matters
                                            </h4>

                                            <p>
                                                {skill.importance_reason}
                                            </p>

                                        </div>
                                    )}


                                    {skill.learning_resources && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Recommended Learning Resources
                                            </h4>

                                            <p>
                                                {skill.learning_resources}
                                            </p>

                                        </div>
                                    )}


                                    {skill.suggested_projects && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Suggested Projects
                                            </h4>

                                            <p>
                                                {skill.suggested_projects}
                                            </p>

                                        </div>
                                    )}


                                    {skill.suggested_courses && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Suggested Courses / Pathways
                                            </h4>

                                            <p>
                                                {skill.suggested_courses}
                                            </p>

                                        </div>
                                    )}


                                    {skill.certifications && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Relevant Certifications
                                            </h4>

                                            <p>
                                                {skill.certifications}
                                            </p>

                                        </div>
                                    )}


                                    {skill.estimated_progression && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Estimated Progression
                                            </h4>

                                            <p>
                                                {skill.estimated_progression}
                                            </p>

                                        </div>
                                    )}


                                    {skill.related_roles && (
                                        <div className="pathway-detail">

                                            <h4>
                                                Related Career Roles
                                            </h4>

                                            <p>
                                                {skill.related_roles}
                                            </p>

                                        </div>
                                    )}

                                </div>

                            )}

                        </div>

                    );

                })}

            </div>

        </section>
    );
}

export default PersonalizedPathway;
