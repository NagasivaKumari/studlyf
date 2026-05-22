import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';

type StageField = {
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
    options?: string[];
    maxLength?: number;
    acceptTypes?: string[];
};

type SubmissionFormProps = {
    eventId: string;
    stage: any;
};

const normalizeFields = (rawFields: any[]): StageField[] => {
    if (!Array.isArray(rawFields)) return [];
    return rawFields.map((field) => ({
        id: String(field.field_id || field.id || field.name || field.label || ''),
        label: String(field.label || field.name || field.field_id || 'Field'),
        type: String(field.field_type || field.type || 'text').toLowerCase(),
        required: field.required !== false,
        placeholder: field.placeholder || field.help_text || '',
        helpText: field.help_text || '',
        options: Array.isArray(field.options) ? field.options.map(String) : undefined,
        maxLength: typeof field.max_length === 'number' ? field.max_length : undefined,
        acceptTypes: Array.isArray(field.accept_types) ? field.accept_types.map(String) : undefined,
    }));
};

const SubmissionForm: React.FC<SubmissionFormProps> = ({ eventId, stage }) => {
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [fileNames, setFileNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [canEditSubmission, setCanEditSubmission] = useState(true);
    const [mirrorNotice, setMirrorNotice] = useState<string | null>(null);
    const [teamId, setTeamId] = useState<string | null>(null);
    const [registered, setRegistered] = useState(true);
    const [resolvedStage, setResolvedStage] = useState<any>(stage);

    const stageId = resolvedStage?.id || stage?.id;
    const stageTitle = String(resolvedStage?.name || stage?.name || 'Submission Stage').trim();
    const fields = useMemo(
        () => normalizeFields(resolvedStage?.fields || resolvedStage?.config?.fields || []),
        [resolvedStage]
    );
    const teamRequired = Boolean(resolvedStage?.team_required || resolvedStage?.teamRequired || stage?.team_required || stage?.teamRequired);
    const stageDescription = String(resolvedStage?.description || resolvedStage?.config?.description || stage?.description || stage?.config?.description || '').trim();
    const stageVisibility = String(resolvedStage?.visibility || stage?.visibility || '').toLowerCase();
    const isPublicStage = stageVisibility === 'public';
    const stageStatusRaw = String(resolvedStage?.status || resolvedStage?.config?.status || '').trim();
    const stageStatus = stageStatusRaw ? stageStatusRaw.toLowerCase() : '';
    const isStageActive = stageStatus === 'active' || stageStatus === 'active';
    const stageDeadlineRaw = resolvedStage?.end_date || resolvedStage?.endDate || resolvedStage?.deadline;

    useEffect(() => {
        if (!stageDeadlineRaw) return;

        const parseDeadline = () => {
            if (stageDeadlineRaw instanceof Date) return stageDeadlineRaw;
            if (typeof stageDeadlineRaw === 'string') {
                const parsed = new Date(stageDeadlineRaw);
                return Number.isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
        };

        const updateLockState = () => {
            const deadline = parseDeadline();
            if (!deadline) return;
            const isLocked = Date.now() > deadline.getTime();
            setCanEditSubmission((prev) => (prev === !isLocked ? prev : !isLocked));
        };

        updateLockState();
        const timer = window.setInterval(updateLockState, 30000);
        return () => window.clearInterval(timer);
    }, [stageDeadlineRaw]);

    useEffect(() => {
        setResolvedStage(stage);
    }, [stage]);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!eventId || !stageId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                if (fields.length === 0) {
                    const stagesRes = await fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/stages`, {
                        headers: { ...authHeaders() },
                    });
                    if (stagesRes.ok) {
                        const stagesData = await stagesRes.json();
                        const found = (stagesData.stages || []).find((s: any) => s.id === stageId) ||
                            (stagesData.stages || []).find((s: any) => String(s.type || '').toUpperCase() === 'SUBMISSION');
                        if (found) {
                            setResolvedStage(found);
                        }
                    }
                }

                const [progressRes, submissionRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/progress`, {
                        headers: { ...authHeaders() },
                    }),
                    fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/stages/${stageId}/submission`, {
                        headers: { ...authHeaders() },
                    }),
                ]);

                if (progressRes.ok) {
                    const progress = await progressRes.json();
                    if (progress.status === 'not_registered') {
                        setRegistered(false);
                        setTeamId(null);
                    } else {
                        setRegistered(true);
                        setTeamId(progress.team?._id || null);
                    }
                }

                if (submissionRes.ok) {
                    const data = await submissionRes.json();
                    if (data?.data) {
                        setFormValues(data.data);
                        if (data.status === 'found') {
                            setSubmitted(true);
                        }
                    }
                    if (typeof data?.can_edit === 'boolean') {
                        setCanEditSubmission(data.can_edit);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load submission details.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [eventId, stageId, fields.length]);

    const updateValue = (fieldId: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !stageId) return;

        for (const field of fields) {
            const value = formValues[field.id];
            if (field.required) {
                if (field.type === 'checkbox' && value !== true) {
                    setError(`${field.label} is required`);
                    return;
                }
                if (field.type !== 'checkbox' && (value === undefined || value === null || value === '')) {
                    setError(`${field.label} is required`);
                    return;
                }
            }
            if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
                setError(`${field.label} cannot exceed ${field.maxLength} characters`);
                return;
            }
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/stages/${stageId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    data: formValues,
                    team_id: teamId || undefined,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to save submission.');
            }

            const saved = await response.json();
            if (saved?.data) {
                setFormValues(saved.data);
            }
            setSubmitted(true);
            if (saved?.mirrored_application) {
                setMirrorNotice('Saved and added to My applications.');
            } else if (saved?.mirrored_application_id) {
                setMirrorNotice('Saved and linked to My applications.');
            } else {
                setMirrorNotice('Saved successfully.');
            }
            alert('Submission saved successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to save submission.');
        } finally {
            setSaving(false);
        }
    };

    if (!eventId || !stageId) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-2">{stageTitle}</h2>
                <p className="text-slate-600">This stage is not configured yet.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center p-8">Loading submission details...</div>;
    }

    if (!registered && !isPublicStage) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-2">{stageTitle}</h2>
                <p className="text-slate-600">Please register for this event before submitting to {stageTitle.toLowerCase()}.</p>
            </div>
        );
    }

    if (teamRequired && !teamId) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-2">{stageTitle}</h2>
                <p className="text-slate-600">Create or join a team to submit for {stageTitle.toLowerCase()}.</p>
            </div>
        );
    }

    if (submitted && !canEditSubmission) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">{stageTitle}</h2>
                <p className="text-green-700 font-medium">Your submission has been saved.</p>
                {mirrorNotice ? <p className="text-sm text-slate-600 mt-2">{mirrorNotice}</p> : null}
                <p className="text-sm text-slate-500 mt-3">Editing is closed for this stage.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">{stageTitle}</h2>
            {submitted && canEditSubmission ? (
                <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Your submission is saved. You can still edit it until the deadline.
                    {mirrorNotice ? <div className="mt-1 font-medium text-emerald-700">{mirrorNotice}</div> : null}
                </div>
            ) : null}
            {stageDescription ? (
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{stageDescription}</p>
            ) : null}
            {isPublicStage && !registered ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                    Public stage: you can submit directly without prior registration.
                </div>
            ) : null}
            {/* Stage status messaging */}
            {stageStatus && stageStatus !== 'active' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-sm text-yellow-800">
                    {stageStatus === 'upcoming' ? (
                        <div>This stage has not started yet. You will be able to submit when it opens.</div>
                    ) : (
                        <div>This stage is closed. Submissions are no longer accepted for this stage.</div>
                    )}
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field) => {
                    const value = formValues[field.id];
                    const inputClass =
                        'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm';

                    return (
                        <div key={field.id}>
                            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    id={field.id}
                                    rows={4}
                                    value={value || ''}
                                    onChange={(e) => updateValue(field.id, e.target.value)}
                                    className={inputClass}
                                    placeholder={field.placeholder || ''}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    id={field.id}
                                    value={value || ''}
                                    onChange={(e) => updateValue(field.id, e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select an option</option>
                                    {(field.options || []).map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === 'checkbox' ? (
                                <label className="flex items-center gap-2 mt-2">
                                    <input
                                        id={field.id}
                                        type="checkbox"
                                        checked={value === true}
                                        onChange={(e) => updateValue(field.id, e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">{field.placeholder || 'Yes'}</span>
                                </label>
                            ) : field.type === 'file' ? (
                                <div className="mt-2">
                                    <input
                                        id={field.id}
                                        type="file"
                                        accept={field.acceptTypes?.join(',')}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setFileNames((prev) => ({ ...prev, [field.id]: file.name }));
                                            const reader = new FileReader();
                                            reader.onload = () => updateValue(field.id, reader.result || '');
                                            reader.readAsDataURL(file);
                                        }}
                                        className={inputClass}
                                    />
                                    {fileNames[field.id] && (
                                        <p className="text-xs text-gray-500 mt-1">Selected: {fileNames[field.id]}</p>
                                    )}
                                </div>
                            ) : (
                                <input
                                    id={field.id}
                                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                                    value={value || ''}
                                    onChange={(e) => updateValue(field.id, e.target.value)}
                                    className={inputClass}
                                    placeholder={field.placeholder || ''}
                                />
                            )}
                            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
                        </div>
                    );
                })}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || (!isStageActive && !submitted) || (!canEditSubmission && submitted)}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isStageActive ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : 'bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80`}
                    >
                        {saving ? 'Saving...' : submitted ? 'Update submission' : (isStageActive ? 'Submit' : 'Stage Closed')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmissionForm;
