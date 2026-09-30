import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/skills.css";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

function SkillsSetup() {

    const navigate = useNavigate();

    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] =
        useState<Skill[]>([]);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [showSkillList, setShowSkillList] =
        useState(false);

    const [error, setError] =
        useState("");

    const [saving, setSaving] =
        useState(false);


    // Debug selected skills
    useEffect(() => {

        console.log(
            "SELECTED SKILLS STATE:",
            selectedSkills
        );

    }, [selectedSkills]);


    // Get all skills + user's existing skills
    useEffect(() => {

        async function getSkills() {

            try {

                const token =
                    localStorage.getItem("token");

                const headers = {
                    Authorization:
                        `Bearer ${token}`
                };


                // Get all skills
                const response =
                    await axios.get(
                        "/api/skills",
                        {
                            headers: headers
                        }
                    );

                console.log(
                    "AXIOS RESPONSE:",
                    response.data
                );

                console.log(
                    "FIRST SKILL:",
                    response.data[0]
                );

                setSkills(response.data);


                // Get user's already selected skills
                const userSkillsResponse =
                    await axios.get(
                        "/api/skills/user",
                        {
                            headers: headers
                        }
                    );

                console.log(
                    "USER SKILLS:",
                    userSkillsResponse.data
                );

                setSelectedSkills(
                    userSkillsResponse.data
                );

            } catch (error) {

                console.error(
                    "LOAD SKILLS ERROR:",
                    error
                );

                setError(
                    "Failed to load skills."
                );

            }

        }

        getSkills();

    }, []);


    // Filter skills based on search text
    const filteredSkills = skills.filter(
        (skill) =>
            skill.skill_name
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )
    );


    // Add skill
    function addSkill(skill: Skill) {

        const alreadySelected =
            selectedSkills.some(
                (item) =>
                    item.skill_id ===
                    skill.skill_id
            );

        if (alreadySelected) {
            return;
        }

        setSelectedSkills((prev) => [
            ...prev,
            skill
        ]);

        // Clear search after selecting
        setSearchTerm("");
setShowSkillList(false);
    }


    // Remove skill
    function removeSkill(skillId: number) {

        setSelectedSkills((prev) =>
            prev.filter(
                (skill) =>
                    skill.skill_id !== skillId
            )
        );

    }


    // Save skills to database
    async function handleContinue() {

        if (selectedSkills.length === 0) {

            setError(
                "Please select at least one skill."
            );

            return;
        }


        try {

            setError("");
            setSaving(true);

            const token =
                localStorage.getItem("token");

            const skillIds =
                selectedSkills.map(
                    (skill) =>
                        skill.skill_id
                );


            const response =
                await axios.put(
                    "/api/skills/user",
                    {
                        skill_ids: skillIds
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            console.log(
                "SAVE RESPONSE:",
                response.data
            );


            navigate("/dashboard");

        } catch (error: any) {

            console.error(
                "SAVE SKILLS ERROR:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to save skills."
            );

        } finally {

            setSaving(false);

        }

    }


    return (

        <div className="skills-page">

            <div className="skills-card">

                <div className="skills-header">

                    <h1>
                        Your Skills
                    </h1>

                    <p>
                        Select the technologies and
                        skills you currently know.
                    </p>

                </div>


                <div className="skills-form">

                    <label htmlFor="skill-search">
                        Select your skills
                    </label>


                    {/* Search input */}
                    <input
                        id="skill-search"
                        type="text"
                        value={searchTerm}
                        placeholder="Search or browse skills..."
                        onFocus={() =>
                            setShowSkillList(true)
                        }
                        onChange={(e) => {

                            setSearchTerm(
                                e.target.value
                            );

                            setShowSkillList(true);

                            setError("");

                        }}
                    />


                    {/* Scrollable skill list */}
                    {showSkillList && (

                        <div className="skill-search-results">

                            {filteredSkills.length === 0 ? (

                                <p className="no-search-results">
                                    No skills found.
                                </p>

                            ) : (

                                filteredSkills.map(
                                    (skill) => {

                                        const alreadySelected =
                                            selectedSkills.some(
                                                (item) =>
                                                    item.skill_id ===
                                                    skill.skill_id
                                            );


                                        return (

                                            <div
                                                key={
                                                    skill.skill_id
                                                }
                                                className={
                                                    `skill-search-item ${
                                                        alreadySelected
                                                            ? "already-selected"
                                                            : ""
                                                    }`
                                                }
                                                onClick={() => {

                                                    if (
                                                        !alreadySelected
                                                    ) {
                                                        addSkill(
                                                            skill
                                                        );
                                                    }

                                                }}
                                            >

                                                <div>

                                                    <span>
                                                        {
                                                            skill.skill_name
                                                        }
                                                    </span>

                

                                                </div>


                                                {alreadySelected && (

                                                    <span className="skill-check">
                                                        ✓
                                                    </span>

                                                )}

                                            </div>

                                        );

                                    }
                                )

                            )}

                        </div>

                    )}


                    {/* Close list */}
                    {showSkillList && (

                        <button
                            type="button"
                            className="skill-list-close"
                            onClick={() =>
                                setShowSkillList(false)
                            }
                        >
                            Close skill list
                        </button>

                    )}


                    {/* Error */}
                    {error && (

                        <p
                            className="skills-error"
                            style={{
                                color: "#dc2626",
                                fontSize: "13px",
                                margin: "8px 0"
                            }}
                        >
                            {error}
                        </p>

                    )}


                    {/* Selected skills */}
                    <div className="selected-section">

                        <p className="selected-title">
                            Selected Skills
                        </p>


                        <div className="selected-skills">

                            {selectedSkills.length === 0 ? (

                                <p className="no-skills">
                                    Your selected skills
                                    will appear here.
                                </p>

                            ) : (

                                selectedSkills.map(
                                    (skill) => (

                                        <div
                                            className="skill-tag"
                                            key={
                                                skill.skill_id
                                            }
                                        >

                                            <span>
                                                {
                                                    skill.skill_name
                                                }
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSkill(
                                                        skill.skill_id
                                                    )
                                                }
                                            >
                                                ×
                                            </button>

                                        </div>

                                    )
                                )

                            )}

                        </div>

                    </div>

                </div>


                {/* Navigation buttons */}
                <div className="navigation-buttons">

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        ← Back
                    </button>


                    <button
                        type="button"
                        className="continue-button"
                        onClick={handleContinue}
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Continue →"}
                    </button>

                </div>

            </div>

        </div>

    );

}

export default SkillsSetup;
