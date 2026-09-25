import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom"; import Navbar from "./ui/Navbar";
import "../css/progress.css";
import PersonalizedPathway from "./PersonalizedPathway";
import { useAuth } from "../context/authContext";
import {
    Target
} from "lucide-react";

type CareerPath = {
    user_career_id: number;
    career_id: number;
    career_name: string;
    description: string;
    category: string;
    is_goal?: number | null;
};

type RoadmapSkill = {
    skill_id: number;
    skill_name: string;
    category: string;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    roadmap_stage: number;
    sequence_order: number;
    priority: "High" | "Medium" | "Low";
    status: "completed" | "started" | "not-started";
    progress_percentage?: number;
};

type SkillProgress = {
    skill_id: number;
    skill_name: string;
    category: string;
    progress_percentage: number;
    skill_level: "Beginner" | "Developing" | "Proficient";
};

type Career = {
    career_id: number;
    career_name: string;
    description: string;
    category: string;
    match_percentage: number;
    matched_count: number;
    total_skills: number;
    matched_skills: string[];
    missing_skills: string[];
};

function Progress() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    /*
     * Save the selected career as the user's active career goal,
     * then refresh the logged-in user so the Profile page (and
     * anything else using career_goal_name) updates automatically.
     */
    async function saveCareerGoal(careerId: number) {

        try {

            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            await axios.put(
                "/api/careers/goal",
                { career_id: careerId },
                { headers }
            );

            const me = await axios.get(
                "/api/auth/me",
                { headers }
            );

            login(me.data);

        } catch (error) {

            console.error("SAVE CAREER GOAL ERROR:", error);
        }
    }


    const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
    const [selectedCareerId, setSelectedCareerId] = useState<number | null>(
        searchParams.get("careerId")
            ? Number(searchParams.get("careerId"))
            : null
    );

    const [career, setCareer] = useState<Career | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapSkill[]>([]);
    const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);

    const [loadingPaths, setLoadingPaths] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(false);

    /*
     * Load all careers selected by the user
     */
    useEffect(() => {

        async function loadCareerPaths() {

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

                setCareerPaths(response.data);

                /*
                 * Automatically select the first career
                 */
                if (response.data.length > 0) {

                    const careerIdFromUrl = searchParams.get("careerId");

                    const currentGoal: CareerPath | undefined =
                        response.data.find(
                            (path: CareerPath) => Number(path.is_goal) === 1
                        );

                    /*
                     * Priority: career in the URL, then the saved
                     * career goal, then the first career path.
                     */
                    let initialCareerId = Number(
                        (currentGoal ?? response.data[0]).career_id
                    );

                    if (careerIdFromUrl) {

                        const requestedCareerExists =
                            response.data.some(
                                (path: CareerPath) =>
                                    Number(path.career_id) ===
                                    Number(careerIdFromUrl)
                            );

                        if (requestedCareerExists) {
                            initialCareerId = Number(careerIdFromUrl);
                        }
                    }

                    setSelectedCareerId(initialCareerId);

                    /*
                     * Keep the profile's career goal in sync with
                     * the career being shown.
                     */
                    if (
                        !currentGoal ||
                        Number(currentGoal.career_id) !== initialCareerId
                    ) {
                        saveCareerGoal(initialCareerId);
                    }
                }

            } catch (error) {

                console.error(
                    "CAREER PATHS ERROR:",
                    error
                );

            } finally {

                setLoadingPaths(false);

            }
        }

        loadCareerPaths();

    }, []);


    /*
     * Load progress for the selected career
     */
    useEffect(() => {

        async function loadProgress() {

            if (!selectedCareerId) {
                return;
            }

            try {

                setLoadingProgress(true);

                setCareer(null);
                setRoadmap([]);

                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };


                /*
                 * Get user's skill progress
                 */
                const skillProgressResponse = await axios.get(
                    "/api/skills/progress",
                    { headers }
                );

                setSkillProgress(
                    skillProgressResponse.data
                );


                /*
                 * Get selected career details
                 */
                const careerResponse = await axios.get(
                    `/api/careers/${selectedCareerId}`,
                    { headers }
                );

                setCareer(
                    careerResponse.data
                );


                /*
                 * Get selected career roadmap
                 */
                const roadmapResponse = await axios.get(
                    `/api/careers/${selectedCareerId}/roadmap`,
                    { headers }
                );

                setRoadmap(
                    roadmapResponse.data
                );

            } catch (error) {

                console.error(
                    "PROGRESS PAGE ERROR:",
                    error
                );

            } finally {

                setLoadingProgress(false);

            }
        }

        loadProgress();

    }, [selectedCareerId]);


    /*
     * Loading career paths
     */
    if (loadingPaths) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="progress-loading">
                        Loading your career paths...
                    </div>

                </main>

            </div>
        );
    }


    /*
     * No career paths selected
     */
    if (!loadingPaths && careerPaths.length === 0) {

        return (
            <div className="dashboard-layout">

                <Navbar />

                <main className="dashboard-content">

                    <div className="progress-empty">

                        <div className="progress-empty-icon">
                            ★
                        </div>

                        <h1>
                            No Career Paths Selected
                        </h1>

                        <p>
                            Select a career path to start
                            tracking your progress.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/careers")
                            }
                        >
                            Explore Careers →
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    /*
     * Calculate roadmap progress
     */
    const getEffectiveRoadmap = () => {

        if (!career) {
            return [];
        }

        return roadmap.map(skill => {

            /*
             * Skills already matched with the career
             * are considered 100% completed.
             */
            const isMatched =
                career.matched_skills.includes(
                    skill.skill_name
                );

            if (isMatched) {

                return {
                    ...skill,
                    progress_percentage: 100,
                    status: "completed" as const
                };

            }


            /*
             * Get tracked progress for missing skill
             */
            const trackedSkill =
                skillProgress.find(
                    progress =>
                        progress.skill_id ===
                        skill.skill_id
                );

            const percentage =
                trackedSkill
                    ? Number(
                        trackedSkill.progress_percentage
                    )
                    : 0;


            let status:
                | "completed"
                | "started"
                | "not-started";


            if (percentage >= 100) {

                status = "completed";

            } else if (percentage > 0) {

                status = "started";

            } else {

                status = "not-started";

            }


            return {
                ...skill,
                progress_percentage: percentage,
                status
            };

        });
    };


    const effectiveRoadmap =
        getEffectiveRoadmap();


    const completedSkills =
        effectiveRoadmap.filter(
            skill =>
                skill.status === "completed"
        );


    const remainingSkills =
        effectiveRoadmap.filter(
            skill =>
                skill.status !== "completed"
        );


    const totalSkills =
        effectiveRoadmap.length;


    const completedCount =
        completedSkills.length;


    // const remainingCount =
    //     remainingSkills.length;


    /*
     * Overall learning progress
     */
    const progressPercentage =
        totalSkills > 0
            ? Math.round(
                effectiveRoadmap.reduce(
                    (total, skill) =>
                        total +
                        (skill.progress_percentage ?? 0),
                    0
                ) / totalSkills
            )
            : 0;


    /*
     * Group roadmap by stage
     */
    const stages =
        Array.from(
            new Set(
                effectiveRoadmap.map(
                    skill =>
                        skill.roadmap_stage
                )
            )
        ).sort(
            (a, b) => a - b
        );


    /*
     * Update skill progress
     */
    // const handleUpdateSkillProgress = async (
    //     skillId: number,
    //     percentage: number
    // ) => {

    //     try {

    //         const token =
    //             localStorage.getItem("token");


    //         await axios.put(
    //             "/api/skills/progress",
    //             {
    //                 skill_id: skillId,
    //                 progress_percentage:
    //                     percentage
    //             },
    //             {
    //                 headers: {
    //                     Authorization:
    //                         `Bearer ${token}`
    //                 }
    //             }
    //         );


    //         if (percentage === 100) {

    //             window.location.reload();

    //         } else {

    //             setSkillProgress(prev =>
    //                 prev.map(skill =>
    //                     skill.skill_id === skillId
    //                         ? {
    //                             ...skill,
    //                             progress_percentage:
    //                                 percentage,
    //                             skill_level:
    //                                 percentage >= 70
    //                                     ? "Proficient"
    //                                     : percentage >= 40
    //                                         ? "Developing"
    //                                         : "Beginner"
    //                         }
    //                         : skill
    //                 )
    //             );

    //         }

    //     } catch (error) {

    //         console.error(
    //             "UPDATE SKILL PROGRESS ERROR:",
    //             error
    //         );

    //         alert(
    //             "Failed to update skill progress"
    //         );
    //     }
    // };


    return (

        <div className="dashboard-layout">
            <Navbar />
            <main className="dashboard-content">
                {/* PAGE HEADER */}
                <div className="progress-header">

                    <div>

                        <p className="dashboard-label">
                            CAREER PROGRESS
                        </p>

                        <h1>
                            Track Your Progress
                        </h1>

                        <p className="progress-subtitle">
                            Monitor your skills and learning
                            progress across your selected
                            career paths.
                        </p>

                    </div>

                </div>


                {/* CAREER SELECTOR */}

                <section className="career-path-selector">

                    <div>

                        <p className="dashboard-label">
                            CAREER PATH
                        </p>

                        <label htmlFor="career-select">
                            Select a career to view your progress
                        </label>
                    </div><div>
                        <select
                            id="career-select"
                            value={
                                selectedCareerId ?? ""
                            }
                            onChange={e => {
                                const newCareerId = Number(e.target.value);

                                setSelectedCareerId(newCareerId);
                                saveCareerGoal(newCareerId);
                            }}
                        >

                            {careerPaths.map(
                                path => (

                                    <option
                                        key={
                                            path.career_id
                                        }
                                        value={
                                            path.career_id
                                        }
                                    >
                                        {path.career_name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </section>


                {/* SELECTED CAREER */}

                {loadingProgress ? (

                    <div className="progress-loading">

                        Loading progress...

                    </div>

                ) : !career ? (

                    <div className="progress-empty">

                        <h2>
                            Unable to load progress
                        </h2>

                    </div>

                ) : (

                    <>

                        {/* SELECTED CAREER TITLE */}
                        <div className="selected-career">
                            <div className="head">
                                <div className="selected-career-heading">

                                    <p className="dashboard-label">
                                        SELECTED CAREER PATHWAY
                                    </p>

                                    <h2>
                                        {career.career_name}
                                    </h2>

                                    <p>
                                        {career.description}
                                    </p>

                                </div>


                                {/* OVERALL PROGRESS */}

                                <section className="overall-progress-card">

                                    <div className="overall-progress-info">

                                        <div>

                                            <span className="progress-card-label">
                                                OVERALL LEARNING PROGRESS
                                            </span>

                                            <h2>
                                                {progressPercentage}%
                                            </h2>

                                            <p>
                                                {completedCount} of{" "}
                                                {totalSkills} skills
                                                completed
                                            </p>

                                        </div>

                                    </div>


                                    <div className="large-progress-bar">

                                        <div
                                            className="large-progress-fill"
                                            style={{
                                                width:
                                                    `${progressPercentage}%`
                                            }}
                                        />

                                    </div>

                                </section>
                            </div>

                            {/* CURRENT POSITION */}

                            <section className="current-position-card">

                                <div className="section-heading">

                                    <div>

                                        <p className="dashboard-label">
                                            YOUR JOURNEY
                                        </p>

                                        <h2>
                                            Where You Are Now
                                        </h2>

                                    </div>

                                </div>


                                <div className="position-content">

                                    <div className="position-item completed-position">

                                        <div className="position-number">
                                            ✓
                                        </div>

                                        <div>

                                            <h3>
                                                {completedCount}
                                                {" "}
                                                Skills Completed
                                            </h3>

                                            <p>
                                                These skills are
                                                already part of your
                                                skill set.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="position-line" />


                                    <div className="position-item next-position">

                                        <div className="position-number">
                                            →
                                        </div>

                                        <div>

                                            <h3>
                                                {remainingSkills.length}
                                                {" "}
                                                Skills To Learn
                                            </h3>

                                            <p>
                                                These skills are
                                                required for your
                                                selected career.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* VISUAL CAREER MAP */}

                            {/* CAREER JOURNEY */}

                            <section className="career-journey-section">

                                <div className="section-heading">

                                    <p className="dashboard-label">
                                        CAREER JOURNEY
                                    </p>

                                </div>


                                <div className="career-journey-card">

                                    <div className="career-journey-header">

                                        <div className="career-journey-target">

                                            <div className="career-journey-target-icon">
                                                <Target size={22} strokeWidth={2.2} />
                                            </div>

                                            <div>
                                                <span>TARGET CAREER</span>

                                                <h3>
                                                    Your Path to {career.career_name}

                                                </h3>
                                            </div>

                                        </div>


                                        <div className="career-journey-progress">

                                            <strong>
                                                {progressPercentage}%
                                            </strong>

                                            <span>
                                                overall progress
                                            </span>

                                        </div>

                                    </div>


                                    <div className="career-journey-line">

                                        {stages.map((stage) => {

                                            const stageSkills =
                                                effectiveRoadmap
                                                    .filter(
                                                        skill =>
                                                            skill.roadmap_stage === stage
                                                    )
                                                    .sort(
                                                        (a, b) =>
                                                            a.sequence_order -
                                                            b.sequence_order
                                                    );

                                            const completedInStage =
                                                stageSkills.filter(
                                                    skill =>
                                                        skill.status === "completed"
                                                ).length;

                                            const stageComplete =
                                                stageSkills.length > 0 &&
                                                completedInStage === stageSkills.length;

                                            const stageProgress =
                                                stageSkills.length > 0
                                                    ? Math.round(
                                                        (completedInStage /
                                                            stageSkills.length) *
                                                        100
                                                    )
                                                    : 0;

                                            return (
                                                <div
                                                    className={`journey-stage ${stageComplete
                                                        ? "journey-stage-complete"
                                                        : ""
                                                        }`}
                                                    key={stage}
                                                >

                                                    <div className="journey-node">

                                                        {stageComplete
                                                            ? "✓"
                                                            : stage}

                                                    </div>

                                                    <div className="journey-stage-info">

                                                        <span>
                                                            STAGE {stage}
                                                        </span>

                                                        <h3>
                                                            Learning Stage {stage}
                                                        </h3>

                                                        <p>
                                                            {completedInStage}/
                                                            {stageSkills.length} skills completed
                                                        </p>

                                                    </div>

                                                    <div className="journey-stage-progress">

                                                        <div>
                                                            <span
                                                                style={{
                                                                    width: `${stageProgress}%`
                                                                }}
                                                            />
                                                        </div>

                                                    </div>

                                                </div>
                                            );

                                        })}


                                        {/* FINAL TARGET */}

                                        <div className="journey-stage journey-final-stage">

                                            <div className="journey-node">
                                                <Target size={22} strokeWidth={2.2} />
                                            </div>

                                            <div className="journey-stage-info">

                                                <span>
                                                    DESTINATION
                                                </span>

                                                <h3>
                                                    {career.career_name}
                                                </h3>

                                                <p>
                                                    Target career
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* PERSONALIZED PATHWAY */}

                            <PersonalizedPathway
                                careerId={
                                    career.career_id
                                }
                            />


                            {/* ROADMAP PROGRESS */}

                            <section className="roadmap-progress-section">

                                <div className="section-heading">

                                    <div>

                                        <p className="dashboard-label">
                                            SKILL ROADMAP
                                        </p>

                                        <h2 style={{ fontSize: "16px" }}>
                                            Your Learning Path
                                        </h2>

                                    </div>

                                </div>


                                <div className="progress-roadmap">

                                    {stages.map(stage => {

                                        const stageSkills =
                                            effectiveRoadmap.filter(
                                                skill =>
                                                    skill.roadmap_stage ===
                                                    stage
                                            );


                                        const stagePercentage =
                                            stageSkills.length > 0
                                                ? Math.round(
                                                    stageSkills.reduce(
                                                        (
                                                            total,
                                                            skill
                                                        ) =>
                                                            total +
                                                            (
                                                                skill.progress_percentage ??
                                                                0
                                                            ),
                                                        0
                                                    ) /
                                                    stageSkills.length
                                                )
                                                : 0;


                                        return (

                                            <div
                                                className="progress-stage"
                                                key={stage}
                                            >

                                                <div className="stage-header">

                                                    <div>

                                                        <span className="stage-number">
                                                            Stage{" "}
                                                            {stage}
                                                        </span>

                                                        <h3 style={{ fontSize: "13px" }}>
                                                            Learning
                                                            Stage{" "}
                                                            {stage}
                                                        </h3>

                                                    </div>

                                                    <span className="stage-percentage">
                                                        {
                                                            stagePercentage
                                                        }%
                                                    </span>

                                                </div>


                                                <div className="stage-progress-bar">

                                                    <div
                                                        className="stage-progress-fill"
                                                        style={{
                                                            width:
                                                                `${stagePercentage}%`
                                                        }}
                                                    />

                                                </div>


                                                <div className="stage-skills">

                                                    {stageSkills.map(
                                                        skill => (

                                                            <div
                                                                className={
                                                                    `progress-skill ${skill.status ===
                                                                        "completed"
                                                                        ? "skill-completed"
                                                                        : "skill-remaining"
                                                                    }`
                                                                }
                                                                key={
                                                                    skill.skill_id
                                                                }
                                                            >

                                                                <div className="skill-check">

                                                                    {
                                                                        skill.status ===
                                                                            "completed"
                                                                            ? "✓"
                                                                            : "○"
                                                                    }

                                                                </div>


                                                                <div className="skill-info">

                                                                    <h4>
                                                                        {
                                                                            skill.skill_name
                                                                        }
                                                                    </h4>


                                                                    <div className="skill-meta">

                                                                        <span>
                                                                            {
                                                                                skill.skill_level
                                                                            }
                                                                        </span>


                                                                        <span
                                                                            className={
                                                                                `skill-priority priority-${(
                                                                                    skill.priority ||
                                                                                    "Medium"
                                                                                ).toLowerCase()}`
                                                                            }
                                                                        >
                                                                            {
                                                                                skill.priority ||
                                                                                "Medium"
                                                                            }{" "}
                                                                            Priority
                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                <div className="skill-status">

                                                                    {
                                                                        skill.status ===
                                                                            "completed"
                                                                            ? "Completed"
                                                                            : skill.status ===
                                                                                "started"
                                                                                ? "Started"
                                                                                : "Not Started"
                                                                    }

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </div>

                                        );

                                    })}

                                </div>

                            </section>


                            {/* NEXT STEP */}

                            {remainingSkills.length > 0 && (

                                <section className="next-step-card">

                                    <div>

                                        <span className="dashboard-label">
                                            RECOMMENDED NEXT STEP
                                        </span>

                                        <h2>
                                            Start with{" "}
                                            {
                                                remainingSkills[0]
                                                    .skill_name
                                            }
                                        </h2>

                                        <p>
                                            This skill is part of
                                            your career roadmap.
                                            Learning it will help
                                            you move closer to your
                                            selected career.
                                        </p>

                                    </div>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/careers/${career.career_id}`
                                            )
                                        }
                                    >
                                        View Skill Roadmap →
                                    </button>

                                </section>

                            )}
                        </div>
                    </>

                )}

            </main>

        </div>
    );
}

export default Progress;
