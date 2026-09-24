import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { getFileUrl } from '../fileUrl';
import { AcademicConstants } from '../utils/constants';
import { useExamFilters, ExamFilterBar, NoFilterMatches, ExamPagination } from '../components/ExamFilters';
import { AdvancedDateTimePicker } from '../components/AdvancedDateTimePicker';

const MAX_QUESTIONS = 100;
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const INITIAL_FORM_DATA = {
    title: '',
    description: '',
    board: 'GSEB',
    std: '',
    medium: 'English',
    stream: 'None',
    subject: '',
    duration: 60,
    orderIndex: 1,
    // Scheduling (local "YYYY-MM-DDTHH:mm" strings from the picker):
    // students can only start from startAt; a student's first attempt before
    // endAt is ranked on the leaderboard, anything after is practice.
    scheduled: false,
    startAt: '',
    hasEnd: false,
    endAt: ''
};

/** ISO/UTC date -> local "YYYY-MM-DDTHH:mm" for the date-time picker. */
const toLocalInput = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatSeconds = (total) => {
    const t = Math.max(0, Math.round(total || 0));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const sec = String(t % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

const STATUS_BADGE = {
    UPCOMING: { cls: 'badge-warning', label: 'Scheduled' },
    LIVE: { cls: 'badge-success', label: 'Live · Ranked' },
    ENDED: { cls: 'badge-neutral', label: 'Ended · Practice' }
};

const formatStart = (value) => new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
});

const emptyQuestion = () => ({
    questionText: '',
    questionImage: null,
    options: OPTION_KEYS.map(key => ({ key, text: '', image: null })),
    correctAnswer: '',
    explanation: ''
});

const inputStyle = "width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;";
const labelStyle = "font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;";
const sectionStyle = "background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);";
const radioRowStyle = "display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;";
const radioLabelStyle = "display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-primary); font-weight: 500;";
const hintStyle = "font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px;";
const sectionTitleStyle = "margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;";

const isQuestionComplete = (q) => {
    if (!q.questionText && !q.questionImage) return false;
    const [a, b] = q.options;
    if ((!a.text && !a.image) || (!b.text && !b.image)) return false;
    const answerOpt = q.options.find(o => o.key === q.correctAnswer);
    return !!answerOpt && !!(answerOpt.text || answerOpt.image);
};

export function ObjectivesTestSeries() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // When true the add/edit form replaces the list as a full page.
    const [showForm, setShowForm] = useState(false);
    const pageRef = useRef(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    // { paper, data, loading } while the leaderboard modal is open.
    const [leaderboard, setLeaderboard] = useState(null);
    const [editingExam, setEditingExam] = useState(null);

    const filters = useExamFilters(exams);
    const totalCount = filters.totalCount;

    const [pdfFile, setPdfFile] = useState(null);
    const [isPdfMode, setIsPdfMode] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [questions, setQuestions] = useState([]);
    const [activeStandards, setActiveStandards] = useState([]);
    // Tracks whether Display Order is still following the auto-suggestion,
    // or was overridden by the user typing into that field directly.
    const [orderIndexAuto, setOrderIndexAuto] = useState(true);
    const orderIndexAutoRef = useRef(true);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setQuestions([]);
        setEditingExam(null);
        setPdfFile(null);
        setIsPdfMode(false);
        setOrderIndexAuto(true);
        orderIndexAutoRef.current = true;
    };

    const closeForm = () => {
        setShowForm(false);
        resetForm();
    };

    const loadExams = () => {
        setLoading(true);
        api.get('/objectivestestseries/all', { noPrefix: true })
            .then(response => setExams(response.data || response || []))
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams();
        api.get('/superadmin/standards', { noPrefix: true })
            .then(res => setActiveStandards(res))
            .catch(err => console.error('Failed to load standards:', err));
    }, []);

    // Switching between list and form swaps the whole page, so start at its top.
    useEffect(() => {
        pageRef.current?.scrollIntoView({ block: 'start' });
    }, [showForm]);

    useEffect(() => {
        if (editingExam || !orderIndexAuto) return;
        if (!formData.std || !formData.subject || !formData.medium) return;
        if ((formData.std === '11' || formData.std === '12') && (!formData.stream || formData.stream === 'None')) return;

        const query = new URLSearchParams({
            std: formData.std,
            subject: formData.subject,
            medium: formData.medium,
            board: formData.board || 'GSEB',
            stream: formData.stream || 'None',
        }).toString();

        api.get(`/objectivestestseries/next-order-index?${query}`, { noPrefix: true })
            .then(res => {
                if (orderIndexAutoRef.current) {
                    setFormData(prev => ({ ...prev, orderIndex: res.nextOrderIndex }));
                }
            })
            .catch(console.error);
    }, [formData.std, formData.subject, formData.medium, formData.board, formData.stream, editingExam, orderIndexAuto]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'orderIndex') {
            setOrderIndexAuto(false);
            orderIndexAutoRef.current = false;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addQuestion = () => {
        if (questions.length >= MAX_QUESTIONS) {
            return showToast(`An Objectives Test Series paper can have at most ${MAX_QUESTIONS} questions.`, 'error');
        }
        setQuestions([...questions, emptyQuestion()]);
    };

    const addBlankQuestions = (count) => {
        const room = MAX_QUESTIONS - questions.length;
        const toAdd = Math.min(count, room);
        if (toAdd <= 0) {
            return showToast(`An Objectives Test Series paper can have at most ${MAX_QUESTIONS} questions.`, 'error');
        }
        setQuestions([...questions, ...Array.from({ length: toAdd }, emptyQuestion)]);
    };

    const updateQuestion = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
    };

    const updateOption = (qIndex, optIndex, field, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const options = q.options.map((o, j) => (j === optIndex ? { ...o, [field]: value } : o));
            return { ...q, options };
        }));
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (file) => {
        if (!file) return null;
        const uploadData = new FormData();
        uploadData.append('image', file);
        try {
            const res = await api.post('/media/upload-image', uploadData, { noPrefix: true, isMultipart: true });
            return res.imageUrl;
        } catch (err) {
            showToast('Image upload failed: ' + err.message, 'error');
            return null;
        }
    };

    const handlePdfUpload = async () => {
        if (!pdfFile) return showToast('Please select a file first', 'error');
        if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
            return showToast('Invalid file type. Only PDF files are supported for extraction.', 'error');
        }
        if (questions.some(isQuestionComplete) && !window.confirm('Replace the questions already entered with the ones from this PDF?')) {
            return;
        }

        setPdfLoading(true);
        const uploadData = new FormData();
        uploadData.append('file', pdfFile);

        try {
            const response = await api.post('/objectivestestseries/upload-pdf', uploadData, { noPrefix: true, isMultipart: true });
            const parsed = response.questions || [];
            if (parsed.length === 0) {
                return showToast('No MCQs found in the PDF. Check the format and try again.', 'error');
            }

            setQuestions(parsed.map(q => ({
                questionText: q.questionText || '',
                questionImage: null,
                options: OPTION_KEYS.map((key, i) => ({ key, text: q.options?.[i]?.text || '', image: null })),
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation || ''
            })));
            if (response.description && !formData.description) {
                setFormData(prev => ({ ...prev, description: response.description }));
            }

            const missingAnswers = parsed.filter(q => !q.correctAnswer).length;
            const truncated = response.totalFound > MAX_QUESTIONS
                ? ` Only the first ${MAX_QUESTIONS} of ${response.totalFound} were kept.` : '';
            showToast(missingAnswers
                ? `${parsed.length} MCQs extracted — ${missingAnswers} need an answer selected.${truncated}`
                : `${parsed.length} MCQs extracted. Review them below.${truncated}`,
                missingAnswers || truncated ? 'error' : 'success');
            setIsPdfMode(false);
        } catch (err) {
            showToast('Failed to process PDF: ' + err.message, 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleEdit = async (exam) => {
        try {
            const full = await api.get(`/objectivestestseries/${exam._id}?original=true`, { noPrefix: true });
            setEditingExam(full._id);
            setOrderIndexAuto(false);
            orderIndexAutoRef.current = false;
            setFormData({
                title: full.title || '',
                description: full.description || '',
                board: full.board || 'GSEB',
                std: full.std || '',
                medium: full.medium || 'English',
                stream: full.stream || 'None',
                subject: full.subject || '',
                duration: full.duration ?? 60,
                scheduled: !!full.startAt,
                startAt: full.startAt ? toLocalInput(full.startAt) : '',
                hasEnd: !!full.endAt,
                endAt: full.endAt ? toLocalInput(full.endAt) : '',
                orderIndex: full.orderIndex || 1
            });
            setQuestions((full.questions || []).map(q => ({
                questionText: q.question || '',
                questionImage: q.questionImage || null,
                options: OPTION_KEYS.map(key => ({ key, text: q[`option${key}`] || '', image: q[`option${key}Image`] || null })),
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation || ''
            })));
            setIsPdfMode(false);
            setShowForm(true);
        } catch (err) {
            showToast('Could not load paper: ' + err.message, 'error');
        }
    };

    const handleSave = async () => {
        if (!formData.title) return showToast('Paper Title is required.', 'error');
        if (!formData.std) return showToast('Standard is required.', 'error');
        if ((formData.std === '11' || formData.std === '12') && (!formData.stream || formData.stream === 'None')) {
            return showToast('Stream is required for Standard 11 and 12.', 'error');
        }
        if (!formData.subject) return showToast('Subject is required.', 'error');
        if (formData.scheduled && !formData.startAt) return showToast('Pick a start date & time, or make the paper available immediately.', 'error');
        if (formData.hasEnd && !formData.endAt) return showToast('Pick an end date & time, or choose "No end date".', 'error');
        if (formData.scheduled && formData.hasEnd && new Date(formData.endAt) <= new Date(formData.startAt)) {
            return showToast('End date & time must be after the start date & time.', 'error');
        }
        if (questions.length === 0) return showToast('Please add at least one question.', 'error');

        const incomplete = questions.findIndex(q => !isQuestionComplete(q));
        if (incomplete >= 0) {
            document.getElementById(`bc-q-${incomplete}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return showToast(`Question ${incomplete + 1} needs text, options A & B, and a correct answer.`, 'error');
        }

        const { scheduled, startAt, hasEnd, endAt, ...details } = formData;
        const payload = {
            ...details,
            // Sent as UTC; the server compares against its own clock.
            startAt: scheduled && startAt ? new Date(startAt).toISOString() : null,
            endAt: hasEnd && endAt ? new Date(endAt).toISOString() : null,
            duration: parseInt(formData.duration) || 0,
            orderIndex: parseInt(formData.orderIndex) || 1,
            questions: questions.map(q => {
                const mapped = {
                    question: q.questionText,
                    questionImage: q.questionImage,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                };
                q.options.forEach(o => {
                    // Image-only options still need a label for the app to render.
                    mapped[`option${o.key}`] = o.text || (o.image ? `Option ${o.key}` : '');
                    mapped[`option${o.key}Image`] = o.image;
                });
                return mapped;
            })
        };

        setSaving(true);
        try {
            if (editingExam) {
                await api.put(`/objectivestestseries/update/${editingExam}`, payload, { noPrefix: true });
                showToast('Objectives Test Series paper updated successfully!');
            } else {
                await api.post('/objectivestestseries/create', payload, { noPrefix: true });
                showToast('Objectives Test Series paper created successfully!');
            }
            closeForm();
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/objectivestestseries/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams();
            showToast('Paper deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const openLeaderboard = async (paper) => {
        setLeaderboard({ paper, data: null, loading: true });
        try {
            const data = await api.get(`/objectivestestseries/${paper._id}/leaderboard`, { noPrefix: true });
            setLeaderboard({ paper, data, loading: false });
        } catch (err) {
            showToast('Could not load leaderboard: ' + err.message, 'error');
            setLeaderboard(null);
        }
    };

    const completeCount = questions.filter(isQuestionComplete).length;

    return (
        <div class="materials-page" ref={pageRef}>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Exams</div>
                    <h1>{showForm ? (editingExam ? 'Edit Objectives Test Series Paper' : 'Add Objectives Test Series Paper') : 'Objectives Test Series'}</h1>
                    <p class="page-subtitle">
                        {showForm
                            ? `Fill in the paper details and add up to ${MAX_QUESTIONS} MCQs.`
                            : `Board-pattern MCQ papers — up to ${MAX_QUESTIONS} questions each.`}
                    </p>
                    {!showForm && (
                        <div class="header-metrics">
                            <div class="header-metric">
                                <span class="hm-value">{totalCount.toLocaleString()}</span>
                                <span class="hm-label">Total Papers</span>
                            </div>
                        </div>
                    )}
                </div>
                <div class="page-header-actions">
                    {showForm ? (
                        <button class="btn btn-outline" onClick={closeForm}>
                            <Icons.ChevronLeft /> Back to list
                        </button>
                    ) : (
                        <>
                            <button class="btn btn-outline" onClick={() => loadExams()}>
                                <Icons.Refresh /> Refresh
                            </button>
                            <button class="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                                <Icons.Plus /> Add New Paper
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showForm ? (
                <>
                    <div class="exam-form" style="display: flex; flex-direction: column; gap: 2rem;">
                        <div style={sectionStyle}>
                            <h4 style={sectionTitleStyle + ' margin-bottom: 1.5rem;'}>
                                <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                Paper Details
                            </h4>
                            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="form-group">
                                    <label style={labelStyle}>Paper Title *</label>
                                    <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. Science Test Series – Paper 1" style={inputStyle} />
                                </div>
                                <div class="form-group">
                                    <label style={labelStyle}>Display Order</label>
                                    <input type="number" name="orderIndex" value={formData.orderIndex} onInput={handleInputChange} style={inputStyle} />
                                    {!editingExam && orderIndexAuto && (
                                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Suggested next order for this Standard/Subject/Medium — edit if needed.</p>
                                    )}
                                </div>
                                <div class="form-group">
                                    <label style={labelStyle}>Board *</label>
                                    <select name="board" value={formData.board} onChange={handleInputChange} style={inputStyle}>
                                        {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style={labelStyle}>Standard *</label>
                                    <select name="std" value={formData.std} onChange={handleInputChange} style={inputStyle}>
                                        <option value="">Select Standard</option>
                                        {activeStandards.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style={labelStyle}>Medium *</label>
                                    <select name="medium" value={formData.medium} onChange={handleInputChange} style={inputStyle}>
                                        {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {(formData.std === '11' || formData.std === '12') && (
                                    <div class="form-group">
                                        <label style={labelStyle}>Stream *</label>
                                        <select name="stream" value={formData.stream} onChange={handleInputChange} style={inputStyle}>
                                            {AcademicConstants.streams.map(s => <option value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div class="form-group">
                                    <label style={labelStyle}>Subject *</label>
                                    <select name="subject" value={formData.subject} onChange={handleInputChange} style={inputStyle}>
                                        <option value="">Select Subject</option>
                                        {(() => {
                                            let subjectKey = `${formData.board}-${formData.std}`;
                                            if (formData.std === '11' || formData.std === '12') subjectKey += `-${formData.stream}`;
                                            return (AcademicConstants.subjects[subjectKey] || []).map(sub => <option value={sub}>{sub}</option>);
                                        })()}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style={labelStyle}>Time Limit (minutes)</label>
                                    <input type="number" min="0" name="duration" value={formData.duration} onInput={handleInputChange} style={inputStyle} />
                                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Set 0 for no time limit.</p>
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label style={labelStyle}>Start</label>
                                    <div style={radioRowStyle}>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" checked={!formData.scheduled} onChange={() => setFormData(prev => ({ ...prev, scheduled: false }))} />
                                            Available immediately
                                        </label>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" checked={formData.scheduled} onChange={() => setFormData(prev => ({ ...prev, scheduled: true }))} />
                                            Schedule start time
                                        </label>
                                    </div>
                                    {formData.scheduled && (
                                        <>
                                            <AdvancedDateTimePicker
                                                value={formData.startAt}
                                                onChange={(value) => setFormData(prev => ({ ...prev, startAt: value }))}
                                                label="Opens for students at"
                                            />
                                            <p style={hintStyle}>
                                                {formData.startAt
                                                    ? (new Date(formData.startAt) > new Date()
                                                        ? `Locked with a countdown until ${formatStart(formData.startAt)}. ${formData.std ? `Std ${formData.std}` : 'The selected standard\'s'} students get a push notification at that time.`
                                                        : 'This time has already passed — the paper will be open straight away.')
                                                    : 'Students see the paper as locked, with a countdown, until this time.'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label style={labelStyle}>End of ranked window</label>
                                    <div style={radioRowStyle}>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" checked={!formData.hasEnd} onChange={() => setFormData(prev => ({ ...prev, hasEnd: false }))} />
                                            No end date
                                        </label>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" checked={formData.hasEnd} onChange={() => setFormData(prev => ({ ...prev, hasEnd: true }))} />
                                            Set end date & time
                                        </label>
                                    </div>
                                    {formData.hasEnd && (
                                        <AdvancedDateTimePicker
                                            value={formData.endAt}
                                            onChange={(value) => setFormData(prev => ({ ...prev, endAt: value }))}
                                            label="Ranked window closes at"
                                        />
                                    )}
                                    <p style={hintStyle}>
                                        {formData.hasEnd && formData.endAt
                                            ? (new Date(formData.endAt) > new Date()
                                                ? `A student's first attempt before ${formatStart(formData.endAt)} counts on the leaderboard. After that the paper stays open for practice only.`
                                                : 'This time has already passed — every attempt will be practice and nothing will be ranked.')
                                            : "Each student's first attempt counts on the leaderboard. Retakes are always practice."}
                                    </p>
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label style={labelStyle}>Description</label>
                                    <textarea name="description" value={formData.description} onInput={handleInputChange} placeholder="Shown to students before they start, e.g. syllabus covered or instructions." style={inputStyle + ' min-height: 80px;'} />
                                </div>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                                <h4 style={sectionTitleStyle}>
                                    <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                    MCQ Questions
                                    <span class="badge badge-neutral" style="margin-left: 4px;">{questions.length} / {MAX_QUESTIONS}</span>
                                </h4>
                                <div style="display: flex; gap: 1rem; align-items: center;">
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-primary); font-weight: 500;">
                                        <input type="radio" checked={!isPdfMode} onChange={() => setIsPdfMode(false)} />
                                        Manual Entry
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-primary); font-weight: 500;">
                                        <input type="radio" checked={isPdfMode} onChange={() => setIsPdfMode(true)} />
                                        Upload PDF
                                    </label>
                                </div>
                            </div>

                            {isPdfMode ? (
                                <div style="padding: 2rem; border: 2px dashed var(--border-color); border-radius: 12px; text-align: center; background: var(--bg-primary);">
                                    <h5 style="margin-bottom: 1rem;">Upload MCQ PDF</h5>
                                    <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem;">
                                        Numbered questions, each with options A–D and an answer line.
                                        An "Answer Key" section at the end also works.
                                    </p>
                                    <pre style="text-align: left; display: inline-block; font-size: 0.8rem; background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 8px; margin: 0 0 1.5rem;">{`1. The SI unit of force is
    A. Joule   B. Newton   C. Watt   D. Pascal
    Ans: B
    Explanation: 1 N = 1 kg·m/s² (optional)`}</pre>
                                    <br />
                                    <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} style="margin-bottom: 1rem; width: 100%; max-width: 300px;" />
                                    <br />
                                    <button class="btn btn-primary" onClick={handlePdfUpload} disabled={!pdfFile || pdfLoading}>
                                        {pdfLoading ? 'Processing PDF...' : 'Process PDF'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                                        <span style="font-size: 0.9rem; color: var(--text-secondary);">
                                            {questions.length === 0 ? 'No questions yet.' : `${completeCount} of ${questions.length} complete`}
                                        </span>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <button class="btn btn-sm btn-outline" onClick={() => addBlankQuestions(MAX_QUESTIONS)} disabled={questions.length >= MAX_QUESTIONS} title="Fill the paper up to 100 blank questions">
                                                <Icons.Plus /> Add {MAX_QUESTIONS}
                                            </button>
                                            <button class="btn btn-sm btn-outline" onClick={addQuestion}><Icons.Plus /> Add Question</button>
                                        </div>
                                    </div>

                                    <div>
                                        {questions.map((q, qIndex) => (
                                            <div key={qIndex} id={`bc-q-${qIndex}`} style={`padding: 1.5rem; border: 1px solid ${isQuestionComplete(q) ? 'var(--border-color)' : 'var(--warning)'}; border-radius: 12px; margin-bottom: 1.25rem; background: var(--bg-primary);`}>
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                                    <strong style="font-size: 1.05rem; color: var(--primary-color);">Question {qIndex + 1}</strong>
                                                    <button class="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIndex)} title="Remove question"><Icons.Trash /></button>
                                                </div>
                                                <textarea
                                                    class="form-control"
                                                    placeholder="Enter question text..."
                                                    style="width: 100%; min-height: 64px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);"
                                                    value={q.questionText}
                                                    onInput={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                />
                                                <div style="display: flex; align-items: center; gap: 1rem; margin: 0.75rem 0;">
                                                    <label class="btn btn-sm btn-outline" style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                                        <Icons.Image /> {q.questionImage ? 'Change Image' : 'Add Image'}
                                                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                            const url = await handleImageUpload(e.target.files[0]);
                                                            if (url) updateQuestion(qIndex, 'questionImage', url);
                                                        }} />
                                                    </label>
                                                    {q.questionImage && (
                                                        <div style="display: flex; align-items: center; gap: 4px;">
                                                            <img src={getFileUrl(q.questionImage)} style="height: 40px; border-radius: 4px;" />
                                                            <button class="btn-close-sm" onClick={() => updateQuestion(qIndex, 'questionImage', null)}>&times;</button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                                    {q.options.map((opt, oIndex) => {
                                                        const isCorrect = q.correctAnswer === opt.key;
                                                        return (
                                                            <div key={opt.key} style={`padding: 0.75rem; border-radius: 8px; border: 1px solid ${isCorrect ? 'var(--success)' : 'var(--border-color)'}; background: var(--bg-secondary);`}>
                                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600;" title="Mark as correct answer">
                                                                        <input type="radio" name={`bc-ans-${qIndex}`} checked={isCorrect} onChange={() => updateQuestion(qIndex, 'correctAnswer', opt.key)} />
                                                                        Option {opt.key}{oIndex < 2 ? ' *' : ''}
                                                                    </label>
                                                                    <label style="cursor: pointer; color: var(--accent);" title="Add option image">
                                                                        <Icons.Image />
                                                                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                                            const url = await handleImageUpload(e.target.files[0]);
                                                                            if (url) updateOption(qIndex, oIndex, 'image', url);
                                                                        }} />
                                                                    </label>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    class="form-control"
                                                                    placeholder={`Option ${opt.key}`}
                                                                    style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);"
                                                                    value={opt.text}
                                                                    onInput={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                                />
                                                                {opt.image && (
                                                                    <div style="margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                                                                        <img src={getFileUrl(opt.image)} style="height: 40px; border-radius: 4px;" />
                                                                        <button class="btn-close-sm" onClick={() => updateOption(qIndex, oIndex, 'image', null)}>&times;</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {!q.correctAnswer && (
                                                    <p style="font-size: 0.8rem; color: var(--warning); margin: 0.5rem 0 0;">Select the correct option.</p>
                                                )}

                                                <input
                                                    type="text"
                                                    class="form-control"
                                                    placeholder="Explanation (optional) — shown to students after they submit"
                                                    style="margin-top: 0.75rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);"
                                                    value={q.explanation}
                                                    onInput={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div style="position: sticky; bottom: 0; z-index: 5; display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding: 1rem 0; background: var(--bg-primary); border-top: 1px solid var(--border-color);">
                        <button class="btn btn-outline" onClick={closeForm}>Cancel</button>
                        {!isPdfMode && (
                            <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : (editingExam ? 'Update Paper' : 'Save Paper')}
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <div class="table-container">
                    <ExamFilterBar {...filters.bar} searchPlaceholder="Search paper, subject…" />

                    {loading ? (
                        <div class="loading-spinner" />
                    ) : exams.length === 0 ? (
                        <div class="empty-state">
                            <div class="empty-state-icon"><Icons.Reports /></div>
                            <h3>No Objectives Test Series papers yet</h3>
                            <p>Add your first board-pattern MCQ paper to get started.</p>
                        </div>
                    ) : filters.filteredCount === 0 ? (
                        <NoFilterMatches onClear={filters.clear} />
                    ) : (
                        <>
                            <div class="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Paper</th>
                                        <th>Subject</th>
                                        <th>Standard</th>
                                        <th>Medium</th>
                                        <th>Order</th>
                                        <th>Duration</th>
                                        <th>Schedule</th>
                                        <th>Questions</th>
                                        <th style="text-align:right;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filters.visible.map(item => (
                                        <tr key={item._id}>
                                            <td>
                                                <div class="identity">
                                                    <div class="avatar avatar-sm" style={{ background: 'var(--accent)' }}><Icons.Sparkles /></div>
                                                    <div class="identity-body">
                                                        <div class="identity-name">{item.title}</div>
                                                        <div class="identity-sub">{item.board}{item.stream && item.stream !== 'None' ? ` · ${item.stream}` : ''}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.subject}</td>
                                            <td><span class="cell-chip">{item.std}</span></td>
                                            <td>{item.medium || '—'}</td>
                                            <td>{item.orderIndex}</td>
                                            <td>{item.duration ? `${item.duration} min` : 'Untimed'}</td>
                                            <td>
                                                <div style="display: flex; flex-direction: column; gap: 2px; font-size: var(--font-xs);">
                                                    <span>From: {item.startAt ? formatStart(item.startAt) : 'Immediately'}</span>
                                                    <span>Ranked until: {item.endAt ? formatStart(item.endAt) : 'No end'}</span>
                                                    <span class={`badge ${(STATUS_BADGE[item.status] || STATUS_BADGE.LIVE).cls}`} style="width: fit-content; margin-top: 2px;">
                                                        {(STATUS_BADGE[item.status] || STATUS_BADGE.LIVE).label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td><span class="badge badge-neutral">{item.questionCount || 0} MCQs</span></td>
                                            <td>
                                                <div class="td-actions" style="justify-content:flex-end;">
                                                    <button class="icon-btn" onClick={() => openLeaderboard(item)} title="Leaderboard" disabled={item.status === 'UPCOMING'}>
                                                        <Icons.TrendUp />
                                                    </button>
                                                    <button class="icon-btn primary" onClick={() => handleEdit(item)} title="Edit Paper">
                                                        <Icons.Edit />
                                                    </button>
                                                    <button class="icon-btn danger" onClick={() => setDeleteConfirm(item)} title="Delete">
                                                        <Icons.Trash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            <ExamPagination {...filters} setPage={filters.setPage} />
                        </>
                    )}
                </div>
            )}

            {leaderboard && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>Leaderboard — {leaderboard.paper.title}</h3>
                            <button class="modal-close" onClick={() => setLeaderboard(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            {leaderboard.loading ? (
                                <div class="loading-spinner" />
                            ) : leaderboard.data.entries.length === 0 ? (
                                <div class="empty-state">
                                    <h3>No ranked attempts yet</h3>
                                    <p>Students' first attempts inside the ranked window will appear here.</p>
                                </div>
                            ) : (
                                <>
                                    <p style="color: var(--text-secondary); margin: 0 0 1rem;">
                                        {leaderboard.data.totalParticipants} ranked participant{leaderboard.data.totalParticipants === 1 ? '' : 's'}
                                        {leaderboard.data.totalParticipants > leaderboard.data.entries.length ? ` · showing top ${leaderboard.data.entries.length}` : ''}
                                        {' · '}ranked by marks, then time taken. Practice attempts are not included.
                                    </p>
                                    <div class="table-scroll">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Student</th>
                                                    <th>Marks</th>
                                                    <th>Accuracy</th>
                                                    <th>Time</th>
                                                    <th>Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.data.entries.map(e => (
                                                    <tr key={e.studentId}>
                                                        <td style="font-weight: 700;">#{e.rank}</td>
                                                        <td>{e.name}</td>
                                                        <td style="font-weight: 600;">{e.obtainedMarks} / {e.totalMarks}</td>
                                                        <td>{e.accuracy ?? 0}%</td>
                                                        <td>{formatSeconds(e.timeTakenSeconds)}</td>
                                                        <td style="font-size: var(--font-xs);">{formatStart(e.submittedAt)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => setLeaderboard(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Paper</h3>
                            <button class="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
