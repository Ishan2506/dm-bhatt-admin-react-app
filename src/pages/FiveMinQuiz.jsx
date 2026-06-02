import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { AcademicConstants } from '../utils/constants';

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

    const loadExams = () => {
        setLoading(true);
        api.get('/fiveMinTest/all', { noPrefix: true })
            .then(setExams)
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

    const handleEdit = (exam) => {
        setEditingExam(exam._id);
        setFormData({
            title: exam.title || '',
            board: exam.board || 'GSEB',
            std: exam.std || '',
            medium: exam.medium || 'English',
            stream: exam.stream && exam.stream !== '-' ? exam.stream : 'None',
            subject: exam.subject || '',
            unit: exam.unit || '',
            overview: exam.overview || ''
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
            while (options.length < 4) options.push({ key: String.fromCharCode(65 + options.length), text: '', image: null });
            return options.slice(0, 4).map((opt, idx) => ({ key: String.fromCharCode(65 + idx), text: opt.text, image: opt.image }));
        };

        const detectCorrectAnswer = (q, options) => {
            const candidate = (q.correctAnswer || q.answer || 'A').toString().trim();
            if (/^option\s*[ABCDabcd]$/.test(candidate)) return candidate.slice(-1).toUpperCase();
            if (/^[ABCDabcd]$/.test(candidate)) return candidate.toUpperCase();
            const matchIndex = options.findIndex((opt) => opt.text.trim().toLowerCase() === candidate.toLowerCase());
            return matchIndex >= 0 ? String.fromCharCode(65 + matchIndex) : 'A';
        };

        const mappedQuestions = (exam.questions || []).map((q) => {
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
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Reports /> 5-Minute Quiz History</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}>
                            <Icons.Plus /> Add New Quiz
                        </button>
                        <button class="btn btn-outline btn-sm" onClick={loadExams}>
                            <Icons.Refresh /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
                ) : exams.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No 5-minute quizzes found.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Std</th>
                                <th>Unit</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(item => (
                                <tr key={item._id}>
                                    <td style="font-weight: 600;">{item.title}</td>
                                    <td>{item.subject}</td>
                                    <td>{item.std} ({item.board})</td>
                                    <td>{item.unit}</td>
                                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => handleEdit(item)} title="Edit Quiz">
                                                <Icons.Edit />
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                <div class="exam-form">
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label>Quiz Title *</label>
                                            <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. History Quiz 1" />
                                        </div>
                                        <div class="form-group">
                                            <label>Board *</label>
                                            <select name="board" value={formData.board} onChange={handleInputChange}>
                                                {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Standard *</label>
                                            <select name="std" value={formData.std} onChange={handleInputChange}>
                                                <option value="">Select Standard</option>
                                                {AcademicConstants.standards[formData.board]?.map(s => <option value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Medium *</label>
                                            <select name="medium" value={formData.medium} onChange={handleInputChange}>
                                                {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        {(formData.std === '11' || formData.std === '12') && (
                                            <div class="form-group">
                                                <label>Stream *</label>
                                                <select name="stream" value={formData.stream} onChange={handleInputChange}>
                                                    {AcademicConstants.streams.map(s => <option value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div class="form-group">
                                            <label>Subject *</label>
                                            <select name="subject" value={formData.subject} onChange={handleInputChange}>
                                                <option value="">Select Subject</option>
                                                {AcademicConstants.subjects[`${formData.board}-${formData.std}${formData.stream !== 'None' ? '-' + formData.stream : ''}`]?.map(sub => (
                                                    <option value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Unit / Chapter *</label>
                                            <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" />
                                        </div>
                                        <div class="form-group" style="grid-column: span 2;">
                                            <label>Overview *</label>
                                            <textarea name="overview" value={formData.overview} onInput={handleInputChange} placeholder="Brief summary of the quiz..." />
                                        </div>
                                    </div>

                                    {!editingExam && (
                                        <div class="mode-selection" style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px;">
                                            <label style="display: block; margin-bottom: 1rem; font-weight: 600;">Question Entry Mode</label>
                                            <div style="display: flex; gap: 2rem;">
                                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                                    <input type="radio" checked={!isManualEntry} onChange={() => setIsManualEntry(false)} />
                                                    Upload PDF (Auto-parse)
                                                </label>
                                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                                    <input type="radio" checked={isManualEntry} onChange={() => setIsManualEntry(true)} />
                                                    Manual Entry
                                                </label>
                                            </div>

                                            {!isManualEntry ? (
                                                <div style="margin-top: 1rem;">
                                                    <input type="file" accept=".pdf" onChange={handleFileChange} />
                                                </div>
                                            ) : (
                                                <div style="margin-top: 1rem;">
                                                    <p style="color: var(--text-secondary);">You will add questions manually in the next step.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div class="review-questions">
                                    <div class="review-header" style="position: sticky; top: 0; background: var(--bg-primary); z-index: 10; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                                        <span>Total Questions: <strong>{parsedQuestions.length}</strong></span>
                                        <button class="btn btn-sm btn-primary" onClick={addQuestion}><Icons.Plus /> Add Question</button>
                                    </div>
                                    <div class="questions-list" style="max-height: 60vh; overflow-y: auto;">
                                        {parsedQuestions.map((q, qIndex) => (
                                            <div key={qIndex} class="question-item" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-primary);">
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                                                    <strong style="font-size: 1.1rem; color: var(--primary-color);">Question {qIndex + 1}</strong>
                                                    <button class="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIndex)}><Icons.Trash /></button>
                                                </div>
                                                
                                                <div class="question-content" style="display: flex; flex-direction: column; gap: 0.75rem;">
                                                    <textarea 
                                                        class="form-control" 
                                                        placeholder="Enter question text..."
                                                        style="width: 100%; min-height: 80px;" 
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
                                                                <img src={q.questionImage.startsWith('http') ? q.questionImage : `http://103.212.121.139:5000/${q.questionImage}`} style="height: 40px; border-radius: 4px;" />
                                                                <button class="btn-close-sm" onClick={() => updateQuestion(qIndex, 'questionImage', null)}>&times;</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div class="options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                                                    {q.options.map((opt, oIndex) => {
                                                        const optKey = String.fromCharCode(65 + oIndex);
                                                        return (
                                                            <div key={optKey} class="option-box" style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                                    <strong>Option {optKey}</strong>
                                                                    <label style="cursor: pointer; color: var(--primary-color);">
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
                                                                    value={opt.text} 
                                                                    onInput={(e) => updateQuestion(qIndex, `option_${optKey}_text`, e.target.value)}
                                                                />
                                                                {opt.image && (
                                                                    <div style="margin-top: 8px; position: relative;">
                                                                        <img src={opt.image.startsWith('http') ? opt.image : `http://103.212.121.139:5000/${opt.image}`} style="height: 40px; border-radius: 4px;" />
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
                                if (reviewMode) setReviewMode(false);
                                else { setShowAddModal(false); resetForm(); }
                            }}>
                                {reviewMode ? 'Back' : 'Cancel'}
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
