import { useState } from "react";
import axios from "axios";
import "../../css/credlyPopup.css";

type CredlyCredential = {
    name: string;
    issuer: string;
    description: string;
    issuedDate: string;
    expiryDate: string;
    credentialType: string;
    level: string;
    imageUrl: string;
    skills: string[];
    credentialUrl: string;
};

type CredlyPopupProps = {
    onClose: () => void;
    onSaved: () => void;
};

function CredlyPopup({
    onClose,
    onSaved
}: CredlyPopupProps) {

    const [url, setUrl] = useState("");

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [credential, setCredential] =
        useState<CredlyCredential | null>(null);


    // ======================================
    // VERIFY CREDLY URL
    // ======================================

    const handleVerify = async () => {

        if (!url.trim()) {

            alert(
                "Please enter your Credly badge URL."
            );

            return;
        }


        try {

            setLoading(true);


            const token =
                localStorage.getItem("token");


            const response = await axios.post(
                "/api/profile/import-credly",
                {
                    url: url.trim()
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            console.log(
                "CREDLY RESPONSE:",
                response.data
            );


            setCredential(
                response.data.credential
            );


        } catch (error: any) {

            console.error(
                "CREDLY IMPORT ERROR:",
                error
            );


            alert(
                error.response?.data?.message ||
                "Unable to read this Credly credential."
            );


        } finally {

            setLoading(false);

        }
    };


    // ======================================
    // SAVE CREDENTIAL
    // ======================================

    const handleSave = async () => {

        if (!credential) {
            return;
        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            await axios.post(
                "/api/profile/course",
                {
                    course_name:
                        credential.name,

                    provider:
                        credential.issuer ||
                        "Credly",

                    description:
                        credential.description,

                    completion_date:
                        credential.issuedDate ||
                        null,

                    certificate_url:
                        credential.credentialUrl,

                    source:
                        "Credly",

                    credential_type:
                        credential.credentialType ||
                        "Certification"
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            alert(
                "Credential added successfully!"
            );


            onSaved();


        } catch (error: any) {

            console.error(
                "SAVE CREDLY ERROR:",
                error
            );


            alert(
                error.response?.data?.message ||
                "Failed to save credential."
            );


        } finally {

            setSaving(false);

        }
    };


    return (
        <div className="popup-overlay">

            <div className="credly-popup">

                <button
                    className="popup-close"
                    onClick={onClose}
                >
                    ×
                </button>


                {/* =================================
                    STEP 1 - ENTER URL
                ================================= */}

                {!credential && (

                    <>
                        <h2>
                            Import from Credly
                        </h2>

                        <p>
                            Paste the public URL of your
                            Credly badge below.
                        </p>


                        <label>
                            Credly Badge URL
                        </label>


                        <input
                            type="text"
                            value={url}
                            onChange={(e) =>
                                setUrl(e.target.value)
                            }
                            placeholder="https://www.credly.com/badges/..."
                        />


                        <div className="popup-actions">

                            <button
                                className="popup-cancel"
                                onClick={onClose}
                            >
                                Cancel
                            </button>


                            <button
                                className="popup-submit"
                                onClick={handleVerify}
                                disabled={loading}
                            >
                                {loading
                                    ? "Checking..."
                                    : "Verify Credential"}
                            </button>

                        </div>
                    </>

                )}


                {/* =================================
                    STEP 2 - SHOW CREDENTIAL
                ================================= */}

                {credential && (

                    <>
                        <h2>
                            Credential Found
                        </h2>


                        {credential.imageUrl && (

                            <img
                                src={
                                    credential.imageUrl
                                }
                                alt="Credly badge"
                                className="credly-badge-image"
                            />

                        )}


                        <h3>
                            {credential.name}
                        </h3>


                        <div className="credential-details">
                            <p>
                                <strong>
                                    Issuer:
                                </strong>{" "}
                                {credential.issuer ||
                                    "Credly"}
                            </p>


                            {credential.credentialType && (

                                <p>
                                    <strong>
                                        Type:
                                    </strong>{" "}
                                    {
                                        credential.credentialType
                                    }
                                </p>

                            )}


                            {credential.level && (

                                <p>
                                    <strong>
                                        Level:
                                    </strong>{" "}
                                    {credential.level}
                                </p>

                            )}


                            {credential.issuedDate && (

                                <p>
                                    <strong>
                                        Issued:
                                    </strong>{" "}
                                    {
                                        credential.issuedDate
                                    }
                                </p>

                            )}


                            {credential.description && (

                                <p>
                                    <strong>
                                        Description:
                                    </strong>{" "}
                                    {
                                        credential.description
                                    }
                                </p>

                            )}

                        </div>


                        {credential.skills &&
                            credential.skills.length > 0 && (

                                <div className="credly-skills">

                                    <strong>
                                        Skills
                                    </strong>


                                    <div>

                                        {credential.skills.map(
                                            (skill) => (

                                                <span
                                                    key={skill}
                                                    className="skill-pill"
                                                >
                                                    {skill}
                                                </span>

                                            )
                                        )}

                                    </div>

                                </div>

                            )}


                        <div className="popup-actions">

                            <button
                                className="popup-cancel"
                                onClick={() =>
                                    setCredential(null)
                                }
                            >
                                Back
                            </button>


                            <button
                                className="popup-submit"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Add to Profile"}
                            </button>

                        </div>

                    </>

                )}

            </div>

        </div>
    );
}

export default CredlyPopup;
