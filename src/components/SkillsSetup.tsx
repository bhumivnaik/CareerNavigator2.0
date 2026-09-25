import { useEffect, useState, type ChangeEvent } from "react";
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
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [selectedSkillId, setSelectedSkillId] = useState("");

    useEffect(() => {
        console.log("SELECTED SKILLS STATE:", selectedSkills);
    }, [selectedSkills]);


    // Get all skills + user's existing skills
    useEffect(() => {

        async function getSkills() {

            try {

                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };


                // Get all skills
                const response = await axios.get(
                    "/api/skills",
                    {
                        headers: headers
                    }
                );

                console.log("AXIOS RESPONSE:", response.data);
                console.log("FIRST SKILL:", response.data[0]);

                setSkills(response.data);


                // Get user's already selected skills
                const userSkillsResponse = await axios.get(
                    "/api/skills/user",
                    {
                        headers: headers
                    }
                );

                console.log(
                    "USER SKILLS:",
                    userSkillsResponse.data
                );

                setSelectedSkills(userSkillsResponse.data);


            } catch (error) {

                console.error(error);

                alert("Failed to load skills");

            }

        }

        getSkills();

    }, []);


    function handleSkillSelect(
        e: ChangeEvent<HTMLSelectElement>
    ) {

        const skillId = e.target.value;

        console.log("SELECTED VALUE:", skillId);


        if (!skillId) {
            return;
        }


        const skill = skills.find(
            (item) => item.skill_id === Number(skillId)
        );

        console.log("FOUND SKILL:", skill);


        if (!skill) {
            return;
        }


        const alreadySelected = selectedSkills.some(
            (item) => item.skill_id === skill.skill_id
        );

        console.log(
            "ALREADY SELECTED:",
            alreadySelected
        );


        if (!alreadySelected) {

            setSelectedSkills((prev) => [
                ...prev,
                skill
            ]);

        }


        // Reset dropdown
        setSelectedSkillId("");

    }


    function removeSkill(skillId: number) {

        setSelectedSkills((prev) =>
            prev.filter(
                (skill) => skill.skill_id !== skillId
            )
        );

    }


    // Save skills to database
    async function handleContinue() {

        if (selectedSkills.length === 0) {

            alert("Please select at least one skill");

            return;
        }


        try {

            const token = localStorage.getItem("token");
            const skillIds = selectedSkills.map(
                (skill) => skill.skill_id
            );

            const response = await axios.put(
                "/api/skills/user",
                { skill_ids: skillIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "SAVE RESPONSE:",
                response.data
            );
            navigate("/dashboard");
        } catch (error: any) {

            console.error("SAVE SKILLS ERROR:", error);
            alert(
                error.response?.data?.message ||
                "Failed to save skills"
            );
        }
    }

    return (

        <div className="skills-page">
            <div className="skills-card">
                <div className="skills-header">
                    <h1>Your Skills</h1>
                    <p>
                        Select the technologies and skills you
                        currently know.
                    </p>
                </div>
                <div className="skills-form">
                    <label htmlFor="skill">
                        Select your skills
                    </label>
                    <select
                        id="skill"
                        value={selectedSkillId}
                        onChange={handleSkillSelect}
                    >
                        <option value="">
                            Select a skill
                        </option>
                        {skills.map((skill) => (
                            <option
                                key={skill.skill_id}
                                value={skill.skill_id}
                            >
                                {skill.skill_name}
                            </option>
                        ))}
                    </select>

                    <div className="selected-section">
                        <p className="selected-title">
                            Selected Skills
                        </p>
                        <div className="selected-skills">
                            {selectedSkills.length === 0 ? (
                                <p className="no-skills">
                                    Your selected skills will appear here.
                                </p>
                            ) : (
                                selectedSkills.map((skill) => (
                                    <div
                                        className="skill-tag"
                                        key={skill.skill_id}
                                    >
                                        <span>
                                            {skill.skill_name}
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
                                ))
                            )}
                        </div>
                    </div>
                </div>

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
                    >
                        Continue →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SkillsSetup;
