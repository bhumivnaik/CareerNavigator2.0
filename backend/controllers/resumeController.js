const path = require("path");
const multer = require("multer");
const { CanvasFactory } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const Groq = require("groq-sdk");

const db = require("../config/db").promise();


// =====================================================
// GROQ
// =====================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const MODEL = "openai/gpt-oss-20b";

// Keep enough headroom under the ~8000 token limit
const MAX_RESUME_CHARS = 10000;


// =====================================================
// MULTER
// =====================================================

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {

    const extension =
        path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [
        ".pdf",
        ".docx"
    ];

    if (!allowedExtensions.includes(extension)) {

        return cb(
            new Error(
                "Only PDF and DOCX files are allowed"
            )
        );
    }

    cb(null, true);
};


const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// =====================================================
// UPLOAD MIDDLEWARE
// =====================================================

const uploadResume = (req, res, next) => {

    upload.single("resume")(
        req,
        res,
        (err) => {

            if (err instanceof multer.MulterError) {

                if (err.code === "LIMIT_FILE_SIZE") {

                    return res.status(400).json({
                        message:
                            "Resume must be smaller than 5 MB"
                    });
                }

                return res.status(400).json({
                    message: err.message
                });
            }


            if (err) {

                return res.status(400).json({
                    message: err.message
                });
            }


            next();
        }
    );
};


// =====================================================
// EXTRACT TEXT
// =====================================================

async function extractResumeText(buffer, originalName, mimetype) {

    const extension =
        path.extname(originalName).toLowerCase();

    console.log("Resume original name:", originalName);
    console.log("Resume MIME type:", mimetype);
    console.log("Resume extension:", extension);

    // PDF
    if (
        mimetype === "application/pdf" ||
        extension === ".pdf"
    ) {

        const parser = new PDFParse({
            data: buffer,
            CanvasFactory
        });

        try {

            const result =
                await parser.getText();

            return result.text;

        } finally {

            await parser.destroy();
        }
    }


    // DOCX
    if (
        mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        extension === ".docx"
    ) {

        const result =
            await mammoth.extractRawText({
                buffer: buffer
            });

        return result.value;
    }


    throw new Error(
        `Unsupported resume file type. MIME: ${mimetype}, Extension: ${extension}`
    );
}


// =====================================================
// CLEAN TEXT
// =====================================================

const cleanResumeText = (text) => {

    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};


// =====================================================
// SKILL ALIASES
// =====================================================

const skillAliases = {

    javascript: [
        "javascript",
        "js",
        "ecmascript"
    ],

    typescript: [
        "typescript",
        "ts"
    ],

    react: [
        "react",
        "react.js",
        "reactjs"
    ],

    "react native": [
        "react native",
        "react-native"
    ],

    nodejs: [
        "node",
        "node.js",
        "nodejs"
    ],

    express: [
        "express",
        "express.js",
        "expressjs"
    ],

    mongodb: [
        "mongodb",
        "mongo",
        "mongo db"
    ],

    mysql: [
        "mysql",
        "my sql"
    ],

    postgresql: [
        "postgresql",
        "postgres",
        "postgre sql"
    ],

    python: [
        "python"
    ],

    java: [
        "java"
    ],

    "c++": [
        "c++",
        "cpp"
    ],

    "c#": [
        "c#",
        "c sharp"
    ],

    php: [
        "php"
    ],

    flutter: [
        "flutter"
    ],

    dart: [
        "dart"
    ],

    html: [
        "html",
        "html5"
    ],

    css: [
        "css",
        "css3"
    ],

    "next.js": [
        "next.js",
        "nextjs",
        "next js"
    ],

    redux: [
        "redux",
        "redux toolkit",
        "rtk"
    ],

    git: [
        "git"
    ],

    github: [
        "github"
    ],

    docker: [
        "docker"
    ],

    sql: [
        "sql"
    ]
};


// =====================================================
// NORMALIZE SKILL
// =====================================================

const normalizeSkillName = (name) => {

    if (!name) {
        return "";
    }

    const normalized =
        String(name)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");


    for (const canonical in skillAliases) {

        if (
            skillAliases[canonical]
                .includes(normalized)
        ) {
            return canonical;
        }
    }


    return normalized;
};


// =====================================================
// MATCH SKILLS
// =====================================================

const matchSkillsToDatabase = (
    aiSkills,
    databaseSkills
) => {

    const matched = [];
    const unmatched = [];


    for (const aiSkill of aiSkills || []) {

        const detectedName =
            typeof aiSkill === "string"
                ? aiSkill
                : aiSkill?.name ||
                aiSkill?.skill ||
                "";


        if (!detectedName) {
            continue;
        }


        const normalizedAI =
            normalizeSkillName(
                detectedName
            );


        const databaseSkill =
            databaseSkills.find(
                dbSkill => {

                    const normalizedDB =
                        normalizeSkillName(
                            dbSkill.skill_name
                        );

                    return (
                        normalizedDB ===
                        normalizedAI
                    );
                }
            );


        if (databaseSkill) {

            matched.push({

                skill_id:
                    databaseSkill.skill_id,

                skill_name:
                    databaseSkill.skill_name,

                detected_as:
                    detectedName
            });

        } else {

            unmatched.push(
                detectedName
            );
        }
    }


    return {
        matched,
        unmatched
    };
};


// =====================================================
// GROQ ANALYSIS
// =====================================================

// =====================================================
// GROQ ANALYSIS
// =====================================================

const analyzeWithGroq = async (resumeText) => {

    const trimmedResumeText =
        resumeText.length > MAX_RESUME_CHARS
            ? resumeText.substring(0, MAX_RESUME_CHARS)
            : resumeText;
    const prompt = `
Analyze this resume and extract only information explicitly present.

Do not invent information.

Return only JSON.

Structure:

{
  "skills": [],
  "education": [],
  "projects": [],
  "experience": [],
  "internships": [],
  "courses": [],
  "certifications": []
}

Education objects:
{
  "degree": "",
  "field_of_study": "",
  "institution": "",
  "start_year": "",
  "end_year": ""
}

Project objects:
{
  "project_name": "",
  "description": "",
  "technologies_used": "",
  "start_date": "",
  "end_date": "",
  "github_repo_url": ""
}

Experience objects:
{
  "company_name": "",
  "job_title": "",
  "description": "",
  "start_date": "",
  "end_date": ""
}

Internship objects:
{
  "company_name": "",
  "job_title": "",
  "description": "",
  "start_date": "",
  "end_date": ""
}

Course objects:
{
  "course_name": "",
  "provider": "",
  "description": "",
  "completion_date": "",
  "certificate_url": ""
}

Certification objects:
{
  "name": "",
  "issuer": "",
  "issue_date": "",
  "credential_id": ""
}

Important:
- Only extract information explicitly present in the resume.
- Do not guess missing dates.
- If a value is not present, return an empty string.
- If a section does not exist, return [].
- For technologies_used, return a comma-separated string.
- Keep dates in the format they appear in the resume where possible.

Resume:

${trimmedResumeText}
`;

    const response =
        await groq.chat.completions.create({

            model: MODEL,

            messages: [

                {
                    role: "system",
                    content:
                        "You are a strict resume extraction system. Return only JSON."
                },

                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0,

            max_completion_tokens: 4800,

            response_format: {
                type: "json_schema",

                json_schema: {

                    name: "resume_analysis",

                    strict: true,

                    schema: {

                        type: "object",

                        properties: {

                            skills: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },

                            education: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        degree: {
                                            type: "string"
                                        },

                                        field_of_study: {
                                            type: "string"
                                        },

                                        institution: {
                                            type: "string"
                                        },

                                        start_year: {
                                            type: "string"
                                        },

                                        end_year: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "degree",
                                        "field_of_study",
                                        "institution",
                                        "start_year",
                                        "end_year"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            projects: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        project_name: {
                                            type: "string"
                                        },

                                        description: {
                                            type: "string"
                                        },

                                        technologies_used: {
                                            type: "string"
                                        },

                                        start_date: {
                                            type: "string"
                                        },

                                        end_date: {
                                            type: "string"
                                        },

                                        github_repo_url: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "project_name",
                                        "description",
                                        "technologies_used",
                                        "start_date",
                                        "end_date",
                                        "github_repo_url"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            experience: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        company_name: {
                                            type: "string"
                                        },

                                        job_title: {
                                            type: "string"
                                        },

                                        description: {
                                            type: "string"
                                        },

                                        start_date: {
                                            type: "string"
                                        },

                                        end_date: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "company_name",
                                        "job_title",
                                        "description",
                                        "start_date",
                                        "end_date"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            internships: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        company_name: {
                                            type: "string"
                                        },

                                        job_title: {
                                            type: "string"
                                        },

                                        description: {
                                            type: "string"
                                        },

                                        start_date: {
                                            type: "string"
                                        },

                                        end_date: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "company_name",
                                        "job_title",
                                        "description",
                                        "start_date",
                                        "end_date"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            courses: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        course_name: {
                                            type: "string"
                                        },

                                        provider: {
                                            type: "string"
                                        },

                                        description: {
                                            type: "string"
                                        },

                                        completion_date: {
                                            type: "string"
                                        },

                                        certificate_url: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "course_name",
                                        "provider",
                                        "description",
                                        "completion_date",
                                        "certificate_url"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            certifications: {
                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        name: {
                                            type: "string"
                                        },

                                        issuer: {
                                            type: "string"
                                        },

                                        issue_date: {
                                            type: "string"
                                        },

                                        credential_id: {
                                            type: "string"
                                        }
                                    },

                                    required: [
                                        "name",
                                        "issuer",
                                        "issue_date",
                                        "credential_id"
                                    ],

                                    additionalProperties: false
                                }
                            }
                        },

                        required: [
                            "skills",
                            "education",
                            "projects",
                            "experience",
                            "internships",
                            "courses",
                            "certifications"
                        ],

                        additionalProperties: false
                    }
                }
            }
        });

    const content =
        response.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error(
            "Groq returned an empty response"
        );
    }

    return JSON.parse(content);
};





// =====================================================
// ANALYZE RESUME
// =====================================================

const analyzeResume = async (
    req,
    res
) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                message: "Please upload a resume"
            });
        }


        const userId =
            req.user.user_id;


        console.log(
            "New resume:",
            req.file.originalname
        );

        console.log(
            "Resume size:",
            req.file.size
        );


        // =================================================
        // 1. EXTRACT TEXT DIRECTLY FROM MEMORY
        // =================================================

        let resumeText =
            await extractResumeText(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );


        resumeText =
            cleanResumeText(
                resumeText
            );


        if (
            !resumeText ||
            resumeText.length < 50
        ) {

            return res.status(400).json({
                message:
                    "Could not extract enough text from resume"
            });
        }


        console.log(
            "Original characters:",
            resumeText.length
        );


        // =================================================
        // 2. LIMIT TEXT
        // =================================================

        if (
            resumeText.length >
            MAX_RESUME_CHARS
        ) {

            resumeText =
                resumeText.substring(
                    0,
                    MAX_RESUME_CHARS
                );
        }


        console.log(
            "Characters sent to Groq:",
            resumeText.length
        );


        // =================================================
        // 3. GROQ ANALYSIS
        // =================================================

        const aiResult =
            await analyzeWithGroq(
                resumeText
            );


        // =================================================
        // 4. GET MASTER SKILLS
        // =================================================

        const [databaseSkills] =
            await db.query(
                `
                SELECT
                    skill_id,
                    skill_name
                FROM skills
                ORDER BY skill_name
                `
            );


        // =================================================
        // 5. MATCH SKILLS
        // =================================================

        const skillMatch =
            matchSkillsToDatabase(
                aiResult.skills,
                databaseSkills
            );


        // =================================================
        // 6. EXISTING USER SKILLS
        // =================================================

        const [existingSkills] =
            await db.query(
                `
                SELECT skill_id
                FROM user_skills
                WHERE user_id = ?
                `,
                [userId]
            );


        const existingSkillIds =
            new Set(
                existingSkills.map(
                    item => item.skill_id
                )
            );


        const skills =
            skillMatch.matched.map(
                skill => ({
                    ...skill,

                    existing:
                        existingSkillIds.has(
                            skill.skill_id
                        )
                })
            );


        // =================================================
        // 7. RETURN ANALYSIS
        // =================================================

        return res.json({

            message:
                "Resume analyzed successfully",

            // No file is stored anymore
            resume_file:
                null,

            skills,

            unmatched_skills:
                skillMatch.unmatched,

            education:
                aiResult.education || [],

            projects:
                aiResult.projects || [],

            experience:
                aiResult.experience || [],

            internships:
                aiResult.internships || [],

            courses:
                aiResult.courses || [],

            certifications:
                aiResult.certifications || []
        });


    } catch (error) {

        console.error(
            "RESUME ANALYSIS ERROR:",
            error
        );


        return res.status(500).json({
            message:
                error.message ||
                "Failed to analyze resume"
        });
    }
};


// =====================================================
// GET STORED RESUME
// =====================================================

// =====================================================
// GET STORED RESUME
// =====================================================

const getResume = async (req, res) => {

    return res.status(404).json({
        message: "Resume storage is not enabled"
    });
};


// =====================================================
// DELETE RESUME
// =====================================================

const deleteResume = async (req, res) => {

    return res.json({
        message: "Resume storage is not enabled"
    });
};

// =====================================================
// IMPORT ANALYZED DATA TO PROFILE
// =====================================================
const safeYear = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const year = Number(value);

    return Number.isInteger(year) ? year : null;
};


const safeDate = (value) => {
    if (!value) return null;

    if (typeof value !== "string") {
        return null;
    }

    const date = value.trim();

    if (
        date.toLowerCase() === "present" ||
        date.toLowerCase() === "current" ||
        date.toLowerCase() === "ongoing" ||
        date.toLowerCase() === "now"
    ) {
        return null;
    }

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }

    // Month + year, e.g. "July 2023"
    const monthYear = date.match(
        /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i
    );

    if (monthYear) {
        const month = new Date(
            `${monthYear[1]} 1, ${monthYear[2]}`
        ).getMonth() + 1;

        return `${monthYear[2]}-${String(month).padStart(2, "0")}-01`;
    }

    // Year only, e.g. "2023"
    if (/^\d{4}$/.test(date)) {
        return `${date}-01-01`;
    }

    return null;
};

// =====================================================
// IMPORT ANALYZED DATA TO PROFILE
// =====================================================

const importResume = async (req, res) => {

    const userId = req.user.user_id;

    const {
        skills = [],
        education = [],
        projects = [],
        experience = [],
        internships = [],
        courses = [],
        certifications = []
    } = req.body;

    const connection = db;

    try {

        await connection.beginTransaction();


        // =================================================
        // SKILLS
        // =================================================

        for (const skill of skills) {

            if (!skill.skill_id) {
                continue;
            }

            const [exists] =
                await connection.query(
                    `
                    SELECT skill_id
                    FROM skills
                    WHERE skill_id = ?
                    `,
                    [skill.skill_id]
                );

            if (exists.length === 0) {
                continue;
            }

            await connection.query(
                `
                INSERT IGNORE INTO user_skills
                (
                    user_id,
                    skill_id
                )
                VALUES (?, ?)
                `,
                [
                    userId,
                    skill.skill_id
                ]
            );
        }


        // =================================================
        // EDUCATION
        // =================================================

        for (const item of education) {

            if (
                !item.degree &&
                !item.institution
            ) {
                continue;
            }

            const [existing] = await connection.query(
                `
        SELECT education_id
        FROM user_education
        WHERE user_id = ?
          AND degree = ?
          AND field_of_study = ?
          AND institution = ?
        LIMIT 1
        `,
                [
                    userId,
                    item.degree || null,
                    item.field_of_study || null,
                    item.institution || null
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
        INSERT INTO user_education
        (
            user_id,
            degree,
            field_of_study,
            institution,
            start_year,
            end_year
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
                [
                    userId,
                    item.degree || null,
                    item.field_of_study || null,
                    item.institution || null,
                    safeYear(item.start_year),
                    safeYear(item.end_year)
                ]
            );
        }


        // =================================================
        // PROJECTS
        // =================================================

        for (const project of projects) {

            const [existing] = await connection.query(
                `
        SELECT project_id
        FROM user_projects
        WHERE user_id = ?
          AND project_name = ?
        LIMIT 1
        `,
                [
                    userId,
                    project.project_name
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
        INSERT INTO user_projects
        (
            user_id,
            project_name,
            description,
            technologies_used,
            start_date,
            end_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
                [
                    userId,
                    project.project_name,
                    project.description || null,
                    project.technologies_used || null,
                    safeDate(project.start_date),
    safeDate(project.end_date)
                ]
            );
        }


        // =================================================
        // EXPERIENCE
        // =================================================

        for (const item of experience) {

            const [existing] = await connection.query(
                `
    SELECT experience_id
    FROM user_experience
    WHERE user_id = ?
      AND experience_type = ?
      AND job_title = ?
      AND company_name = ?
      AND start_date <=> ?
    LIMIT 1
    `,
                [
                    userId,
                    "Job",
                    item.job_title || null,
                    item.company_name || null,
                    safeDate(item.start_date)
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
                INSERT INTO user_experience
                (
                    user_id,
                    experience_type,
                    job_title,
                    company_name,
                    description,
                    start_date,
                    end_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    "Job",
                    item.job_title || null,
                    item.company_name || null,
                    item.description || null,
                    safeDate(item.start_date),
                    safeDate(item.end_date)
                ]
            );
        }


        // =================================================
        // INTERNSHIPS
        // =================================================

        for (const item of internships) {

            const [existing] = await connection.query(
                `
    SELECT experience_id
    FROM user_experience
    WHERE user_id = ?
      AND experience_type = ?
      AND job_title = ?
      AND company_name = ?
      AND start_date <=> ?
    LIMIT 1
    `,
                [
                    userId,
                    "Internship",
                    item.job_title || null,
                    item.company_name || null,
                    safeDate(item.start_date)
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
                INSERT INTO user_experience
                (
                    user_id,
                    experience_type,
                    job_title,
                    company_name,
                    description,
                    start_date,
                    end_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    "Internship",
                    item.job_title || null,
                    item.company_name || null,
                    item.description || null,
                    safeDate(item.start_date),
                    safeDate(item.end_date)
                ]
            );
        }


        // =================================================
        // COURSES
        // =================================================

        for (const item of courses) {

            const [existing] = await connection.query(
                `
    SELECT course_id
    FROM user_courses
    WHERE user_id = ?
      AND course_name = ?
      AND provider <=> ?
    LIMIT 1
    `,
                [
                    userId,
                    item.course_name,
                    item.provider || null
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
                INSERT INTO user_courses
                (
                    user_id,
                    course_name,
                    provider,
                    description,
                    completion_date,
                    certificate_url
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    item.course_name,
                    item.provider || null,
                    item.description || null,
                    safeDate(item.completion_date),
                    item.certificate_url || null
                ]
            );
        }


        // =================================================
        // CERTIFICATIONS
        // =================================================

        for (const item of certifications) {

            const [existing] = await connection.query(
                `
        SELECT course_id
        FROM user_courses
        WHERE user_id = ?
          AND course_name = ?
          AND provider <=> ?
        LIMIT 1
        `,
                [
                    userId,
                    item.name,
                    item.issuer || null
                ]
            );

            if (existing.length > 0) {
                continue;
            }

            await connection.query(
                `
        INSERT INTO user_courses
        (
            user_id,
            course_name,
            provider,
            description,
            completion_date,
            certificate_url
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
                [
                    userId,
                    item.name,
                    item.issuer || null,
                    item.credential_id
                        ? `Credential ID: ${item.credential_id}`
                        : null,
                    safeDate(item.issue_date),
                    null
                ]
            );
        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();

        return res.json({
            message:
                "Resume data added to profile successfully"
        });


    } catch (error) {

        await connection.rollback();

        console.error(
            "IMPORT RESUME ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to add resume data to profile"
        });

    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    uploadResume,

    analyzeResume,
    deleteResume,

    getResume,

    importResume
};
