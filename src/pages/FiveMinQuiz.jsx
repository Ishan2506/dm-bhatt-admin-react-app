import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { AcademicConstants } from '../utils/constants';
import { getFileUrl } from '../fileUrl';
import { useExamFilters, ExamFilterBar, NoFilterMatches, ExamPagination } from '../components/ExamFilters';

const INITIAL_FORM_DATA = {
    title: '',
    board: 'GSEB',
    std: '',
    medium: 'English',
    stream: 'None',
    subject: '',
    unit: '',
    overview: ''
};

export function FiveMinQuiz() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingExam, setEditingExam] = useState(null);

    const filters = useExamFilters(exams);
    const totalCount = filters.totalCount;

    // Form State
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [reviewMode, setReviewMode] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setIsManualEntry(false);
        setSelectedFile(null);
        setParsedQuestions([]);
        setReviewMode(false);
        setIsUploading(false);
        setEditingExam(null);
    };

    // The API returns every quiz as a plain array (it ignores skip/limit), so the
    // full list is held in state and filtered/paginated on the client.
    const loadExams = () => {
        setLoading(true);
        api.get('/fiveMinTest/all', { noPrefix: true })
            .then(response => setExams(response.data || response || []))
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'board') {
             setFormData(prev => ({ ...prev, std: '', subject: '' }));
        }
        if (name === 'std') {
             setFormData(prev => ({ ...prev, subject: '' }));
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleProcessPdf = async () => {
        if (!selectedFile) return showToast('Please select a PDF file', 'error');
        
        setIsUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedFile);

            const result = await api.post('/fiveMinTest/upload-pdf', formDataUpload, { 
                noPrefix: true,
                isMultipart: true 
            });

            if (result.questions && result.questions.length > 0) {
                // Helper: safely extract a string value from option (could be string or object)
                const getText = (val) => {
                    if (!val) return '';
                    if (typeof val === 'string') return val;
                    if (typeof val === 'object') return val.text || val.value || val.option || '';
                    return String(val);
                };

                // Helper: extract correct answer letter (A/B/C/D)
                const getAnswer = (val) => {
                    if (!val) return 'A';
                    if (typeof val === 'string') {
                        const v = val.trim().toUpperCase();
                        if (v === 'A' || v === 'B' || v === 'C' || v === 'D') return v;
                        if (v.startsWith('OPTION ')) return v.charAt(v.length - 1);
                    }
                    if (typeof val === 'object') return val.key || 'A';
                    return 'A';
                };

                const questions = result.questions.slice(0, 5).map(q => ({
                    questionText: getText(q.questionText || q.question || q.questionTextManual || ''),
                    questionImage: null,
                    options: [
                        { key: 'A', text: getText(q.options?.[0]), image: null },
                        { key: 'B', text: getText(q.options?.[1]), image: null },
                        { key: 'C', text: getText(q.options?.[2]), image: null },
                        { key: 'D', text: getText(q.options?.[3]), image: null },
                    ],
                    correctAnswer: getAnswer(q.correctAnswer || q.answer)
                }));

                // If overview is in the result, populate it
                if (result.overview) {
                    setFormData(prev => ({ ...prev, overview: result.overview }));
                }

                setParsedQuestions(questions);
                setReviewMode(true);
                showToast(`PDF processed! ${questions.length} questions extracted.`);
            } else {
                showToast('No questions found in PDF', 'error');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return null;
        const uploadData = new FormData();
        uploadData.append('image', file);
        try {
            const res = await api.post('/media/upload-image', uploadData, { 
                noPrefix: true, 
                isMultipart: true 
            });
            return res.imageUrl;
        } catch (err) {
            showToast('Image upload failed: ' + err.message, 'error');
            return null;
        }
    };

    const fetchFiveMinTestDetail = async (id) => {
        const candidates = [
            `/fiveMinTest/${id}`,
            `/fiveMinTest/get/${id}`,
            `/fiveMinTest/view/${id}`,
            `/fiveMinTest/details/${id}`
        ];
        for (const path of candidates) {
            try {
                const response = await api.get(path, { noPrefix: true });
                if (response && response.questions) {
                    return response;
                }
            } catch (e) {
                // Try the next candidate endpoint
            }
        }
        return null;
    };

    const handleSaveExam = async () => {
        if (parsedQuestions.length === 0) {
            return showToast("Cannot save empty quiz.", "error");
        }

        // Deep validation for each question
        for (let i = 0; i < parsedQuestions.length; i++) {
            const q = parsedQuestions[i];
            if (!q.questionText && !q.questionImage) {
                return showToast(`Question ${i + 1} must have either text or an image.`, "error");
            }
            if ((!q.options[0].text && !q.options[0].image) || (!q.options[1].text && !q.options[1].image)) {
                return showToast(`Question ${i + 1} must have at least first two options filled.`, "error");
            }
        }

        try {
            const payload = {
                title: formData.title,
                board: formData.board,
                std: formData.std,
                medium: formData.medium,
                stream: formData.stream === 'None' ? '-' : formData.stream,
                subject: formData.subject,
                unit: formData.unit,
                overview: formData.overview,
                questions: parsedQuestions
            };

            if (editingExam) {
                await api.put(`/fiveMinTest/update/${editingExam}`, payload, { noPrefix: true });
                showToast('Quiz updated successfully!');
            } else {
                await api.post('/fiveMinTest/create', payload, { noPrefix: true });
                showToast('Quiz created successfully!');
            }
            setShowAddModal(false);
            resetForm();
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/fiveMinTest/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams();
            showToast('Quiz deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleEdit = async (exam) => {
        let editableExam = exam;
        if (Array.isArray(exam.questions) && exam.questions.length > 0 && typeof exam.questions[0] === 'string') {
            const detail = await fetchFiveMinTestDetail(exam._id);
            if (detail) {
                editableExam = detail;
            } else {
                showToast('Could not load detailed quiz data.', 'error');
            }
        }

        setEditingExam(editableExam._id);
        setFormData({
            title: editableExam.title || '',
            board: editableExam.board || 'GSEB',
            std: editableExam.std || '',
            medium: editableExam.medium || 'English',
            stream: editableExam.stream && editableExam.stream !== '-' ? editableExam.stream : 'None',
            subject: editableExam.subject || '',
            unit: editableExam.unit || '',
            overview: editableExam.overview || ''
        });

        const normalizeOption = (opt) => {
            if (!opt) return { text: '', image: null };
            if (typeof opt === 'string') return { text: opt, image: null };
            return { text: opt.text || opt.value || opt.option || '', image: opt.image || null };
        };

        const buildOptions = (q) => {
            let rawOptions = q.options;
            if (!Array.isArray(rawOptions)) {
                rawOptions = [q.optionA, q.optionB, q.optionC, q.optionD].filter((opt) => opt !== undefined && opt !== null);
                if (rawOptions.length === 0 && q.options && typeof q.options === 'object') {
                    rawOptions = Object.keys(q.options)
                        .sort()
                        .map((key) => q.options[key]);
                }
            }
            const options = rawOptions.map(normalizeOption);
            while (options.length < 4) options.push({ text: '', image: null });
            return options.slice(0, 4).map((opt, idx) => ({ key: String.fromCharCode(65 + idx), text: opt.text, image: opt.image }));
        };

        const detectCorrectAnswer = (q, options) => {
            const candidate = (q.correctAnswer || q.answer || 'A').toString().trim();
            if (/^option\s*[ABCDabcd]$/.test(candidate)) return candidate.slice(-1).toUpperCase();
            if (/^[ABCDabcd]$/.test(candidate)) return candidate.toUpperCase();
            const matchIndex = options.findIndex((opt) => opt.text.trim().toLowerCase() === candidate.toLowerCase());
            return matchIndex >= 0 ? String.fromCharCode(65 + matchIndex) : 'A';
        };

        const mappedQuestions = (editableExam.questions || []).map((q) => {
            if (typeof q === 'string') {
                return {
                    questionText: '',
                    questionImage: null,
                    options: [
                        { key: 'A', text: '', image: null },
                        { key: 'B', text: '', image: null },
                        { key: 'C', text: '', image: null },
                        { key: 'D', text: '', image: null }
                    ],
                    correctAnswer: 'A'
                };
            }

            const options = buildOptions(q);
            return {
                questionText: q.questionText || q.question || '',
                questionImage: q.questionImage || null,
                options,
                correctAnswer: detectCorrectAnswer(q, options)
            };
        });

        setParsedQuestions(mappedQuestions);
        setIsManualEntry(true);
        setReviewMode(true);
        setShowAddModal(true);
    };

    const addQuestion = () => {
        setParsedQuestions([...parsedQuestions, { 
            questionText: '', 
            questionImage: null,
            options: [
                { key: 'A', text: '', image: null },
                { key: 'B', text: '', image: null },
                { key: 'C', text: '', image: null },
                { key: 'D', text: '', image: null },
            ], 
            correctAnswer: 'A' 
        }]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...parsedQuestions];
        if (field === 'questionText' || field === 'correctAnswer' || field === 'questionImage') {
            updated[index][field] = value;
        } else if (field.startsWith('option')) {
            const [_, optKey, subField] = field.split('_');
            const optIndex = optKey.charCodeAt(0) - 65;
            updated[index].options[optIndex][subField] = value;
        }
        setParsedQuestions(updated);
    };

    const removeQuestion = (index) => {
        setParsedQuestions(parsedQuestions.filter((_, i) => i !== index));
    };

    return (
        <div class="materials-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Exams</div>
                    <h1>5-Minute Quiz</h1>
                    <p class="page-subtitle">Quick-fire quizzes designed for short revision sessions.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{totalCount.toLocaleString()}</span>
                            <span class="hm-label">Total Quizzes</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={() => loadExams()}>
                        <Icons.Refresh /> Refresh
                    </button>
                    <button class="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Icons.Plus /> Add New Quiz
                    </button>
                </div>
            </div>

            <div class="table-container">
                <ExamFilterBar {...filters.bar} searchPlaceholder="Search quiz, subject, unit…" />

                {loading ? (
                    <div class="loading-spinner" />
                ) : exams.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Reports /></div>
                        <h3>No quizzes yet</h3>
                        <p>Add your first 5-minute quiz to get started.</p>
                    </div>
                ) : filters.filteredCount === 0 ? (
                    <NoFilterMatches onClear={filters.clear} />
                ) : (
                    <>
                        <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Quiz</th>
                                    <th>Subject</th>
                                    <th>Standard</th>
                                    <th>Medium</th>
                                    <th>Unit</th>
                                    <th>Created</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filters.visible.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div class="identity">
                                                <div class="avatar avatar-sm" style={{ background: 'var(--warning)' }}><Icons.Clock /></div>
                                                <div class="identity-body">
                                                    <div class="identity-name">{item.title}</div>
                                                    <div class="identity-sub">{item.board}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.subject}</td>
                                        <td><span class="cell-chip">{item.std}</span></td>
                                        <td>{item.medium || '—'}</td>
                                        <td>{item.unit}</td>
                                        <td style="font-size:var(--font-xs);">{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                <button class="icon-btn primary" onClick={() => handleEdit(item)} title="Edit Quiz">
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

            {showAddModal && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>{reviewMode ? (editingExam ? 'Edit Quiz Questions' : 'Review Quiz Questions') : (editingExam ? 'Edit 5-Minute Quiz' : 'Add New 5-Minute Quiz')}</h3>
                            <button class="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>&times;</button>
                        </div>
                        <div class="modal-body">
                            {!reviewMode ? (
                                <div class="exam-form" style="display: flex; flex-direction: column; gap: 2rem;">
                                    <div style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                        <h4 style="margin: 0 0 1.5rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                            Quiz Details
                                        </h4>
                                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Quiz Title *</label>
                                                <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. History Quiz 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                            </div>
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Board *</label>
                                                <select name="board" value={formData.board} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                    {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Standard *</label>
                                                <select name="std" value={formData.std} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                    <option value="">Select Standard</option>
                                                    {AcademicConstants.standards[formData.board]?.map(s => <option value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Medium *</label>
                                                <select name="medium" value={formData.medium} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                    {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            {(formData.std === '11' || formData.std === '12') && (
                                                <div class="form-group">
                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Stream *</label>
                                                    <select name="stream" value={formData.stream} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                        {AcademicConstants.streams.map(s => <option value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Subject *</label>
                                                <select name="subject" value={formData.subject} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                    <option value="">Select Subject</option>
                                                    {AcademicConstants.subjects[`${formData.board}-${formData.std}${formData.stream !== 'None' ? '-' + formData.stream : ''}`]?.map(sub => (
                                                        <option value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Unit / Chapter *</label>
                                                <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                            </div>
                                            <div class="form-group" style="grid-column: span 2;">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Overview *</label>
                                                <textarea name="overview" value={formData.overview} onInput={handleInputChange} placeholder="Brief summary of the quiz..." style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem; min-height: 80px;" />
                                            </div>
                                        </div>
                                    </div>

                                    {!editingExam && (
                                        <div class="mode-selection" style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                            <h4 style="margin: 0 0 1.5rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                                <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                                Question Entry Mode
                                            </h4>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                                <label style="padding: 1.25rem; border: 2px solid ${!isManualEntry ? 'var(--accent)' : 'var(--border-color)'}; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: all 0.2s; background: ${!isManualEntry ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent'};">
                                                    <input type="radio" checked={!isManualEntry} onChange={() => setIsManualEntry(false)} style="cursor: pointer; width: 20px; height: 20px;" />
                                                    <div>
                                                        <div style="font-weight: 600; color: var(--text-primary);">PDF Upload</div>
                                                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Auto-parse questions</div>
                                                    </div>
                                                </label>
                                                <label style="padding: 1.25rem; border: 2px solid ${isManualEntry ? 'var(--accent)' : 'var(--border-color)'}; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: all 0.2s; background: ${isManualEntry ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent'};">
                                                    <input type="radio" checked={isManualEntry} onChange={() => setIsManualEntry(true)} style="cursor: pointer; width: 20px; height: 20px;" />
                                                    <div>
                                                        <div style="font-weight: 600; color: var(--text-primary);">Manual Entry</div>
                                                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Add questions one by one</div>
                                                    </div>
                                                </label>
                                            </div>

                                            {!isManualEntry ? (
                                                <div style="margin-top: 1.5rem; padding: 1.25rem; background: var(--bg-primary); border-radius: 8px; border: 1px dashed var(--border-color);">
                                                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                                                        <input type="file" accept=".pdf" onChange={handleFileChange} style="padding: 0.75rem; cursor: pointer;" />
                                                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                                                            <strong>Expected Format:</strong><br/>1. Question... A) Choice... B)... Answer: A
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style="margin-top: 1.5rem; padding: 1.25rem; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);">
                                                    <p style="color: var(--text-secondary); margin: 0; font-size: 0.95rem;">You will add questions manually in the next step.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div class="review-questions">
                                    {editingExam && (
                                        <div style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                                            <h4 style="margin: 0 0 1.5rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                                <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                                Edit Quiz Details
                                            </h4>
                                            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                                <div class="form-group">
                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Quiz Title *</label>
                                                    <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. History Quiz 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.95rem;" />
                                                </div>
                                                <div class="form-group">
                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Unit / Chapter *</label>
                                                    <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.95rem;" />
                                                </div>
                                                <div class="form-group" style="grid-column: span 2;">
                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Overview *</label>
                                                    <textarea name="overview" value={formData.overview} onInput={handleInputChange} placeholder="Brief summary of the quiz..." style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.95rem; min-height: 80px;" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div class="review-header" style="position: sticky; top: 0; background: var(--bg-secondary); z-index: 10; margin-bottom: 1rem; padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                                        <span style="font-weight: 600; color: var(--text-primary);">Total: <strong>{parsedQuestions.length}</strong></span>
                                        <button class="btn btn-sm btn-primary" onClick={addQuestion}><Icons.Plus /> Add Question</button>
                                    </div>
                                    <div class="questions-list" style="max-height: 60vh; overflow-y: auto;">
                                        {parsedQuestions.map((q, qIndex) => (
                                            <div key={qIndex} class="question-item" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary);">
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                                                    <strong style="font-size: 1.1rem; color: var(--primary-color);">Question {qIndex + 1}</strong>
                                                    <button class="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIndex)}><Icons.Trash /></button>
                                                </div>

                                                <div class="question-content" style="display: flex; flex-direction: column; gap: 0.75rem;">
                                                    <textarea
                                                        class="form-control"
                                                        placeholder="Enter question text..."
                                                        style="width: 100%; min-height: 80px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);"
                                                        value={q.questionText}
                                                        onInput={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                    />
                                                    
                                                    <div class="image-upload-row" style="display: flex; align-items: center; gap: 1rem;">
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
                                                </div>

                                                <div class="options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                                                    {q.options.map((opt, oIndex) => {
                                                        const optKey = String.fromCharCode(65 + oIndex);
                                                        return (
                                                            <div key={optKey} class="option-box" style="padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                                    <strong style="color: var(--text-primary);">Option {optKey}</strong>
                                                                    <label style="cursor: pointer; color: var(--accent);">
                                                                        <Icons.Image />
                                                                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                                            const url = await handleImageUpload(e.target.files[0]);
                                                                            if (url) updateQuestion(qIndex, `option_${optKey}_image`, url);
                                                                        }} />
                                                                    </label>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    class="form-control"
                                                                    placeholder={`Enter option ${optKey}...`}
                                                                    style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);"
                                                                    value={opt.text}
                                                                    onInput={(e) => updateQuestion(qIndex, `option_${optKey}_text`, e.target.value)}
                                                                />
                                                                {opt.image && (
                                                                    <div style="margin-top: 8px; position: relative;">
                                                                        <img src={getFileUrl(opt.image)} style="height: 40px; border-radius: 4px;" />
                                                                        <button class="btn-close-sm" style="position: absolute; top: -8px; right: -8px; background: red; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border: none;" onClick={() => updateQuestion(qIndex, `option_${optKey}_image`, null)}>&times;</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style="margin-top: 1.5rem; padding: 1rem; border-top: 1px dashed var(--border-color); display: flex; align-items: center; gap: 1rem;">
                                                    <label style="font-weight: 600;">Correct Answer:</label>
                                                    <div style="display: flex; gap: 1rem;">
                                                        {['A', 'B', 'C', 'D'].map(letter => (
                                                            <button 
                                                                key={letter}
                                                                class={`btn btn-sm ${q.correctAnswer === letter ? 'btn-success' : 'btn-outline'}`}
                                                                onClick={() => updateQuestion(qIndex, 'correctAnswer', letter)}
                                                            >
                                                                {letter}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => {
                                if (reviewMode && !editingExam) setReviewMode(false);
                                else { setShowAddModal(false); resetForm(); }
                            }}>
                                {reviewMode ? (editingExam ? 'Cancel' : 'Back') : 'Cancel'}
                            </button>
                            {!reviewMode ? (
                                <button class="btn btn-primary" onClick={() => {
                                    if (!formData.title) return showToast("Quiz Title is required.", "error");
                                    if (!formData.std) return showToast("Standard is required.", "error");
                                    if (!formData.subject) return showToast("Subject is required.", "error");
                                    if (!formData.unit) return showToast("Unit/Chapter is required.", "error");
                                    if (!formData.overview) return showToast("Overview is required.", "error");

                                    if (editingExam) {
                                        // For edit mode, go directly to review (questions already loaded)
                                        setReviewMode(true);
                                    } else if (isManualEntry) {
                                        setReviewMode(true);
                                    } else {
                                        handleProcessPdf();
                                    }
                                }} disabled={isUploading}>
                                    {isUploading ? 'Processing...' : (editingExam ? 'Continue to Questions' : (isManualEntry ? 'Continue' : 'Upload & Process PDF'))}
                                </button>
                            ) : (
                                <button class="btn btn-primary" onClick={handleSaveExam}>
                                    {editingExam ? 'Update Quiz' : 'Save Quiz'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Quiz</h3>
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
