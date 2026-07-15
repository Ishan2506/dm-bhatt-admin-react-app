import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { getFileUrl } from '../fileUrl';
import { AcademicConstants } from '../utils/constants';
import { useExamFilters, ExamFilterBar, NoFilterMatches, ExamPagination } from '../components/ExamFilters';

const INITIAL_FORM_DATA = {
    title: '',
    board: 'GSEB',
    std: '',
    medium: 'English',
    stream: 'None',
    subject: '',
    unit: '',
    totalMarks: '',
    overview: ''
};

export function TrueFalseExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingExam, setEditingExam] = useState(null);

    const filters = useExamFilters(exams);
    const totalCount = filters.totalCount;

    // PDF Upload states
    const [pdfFile, setPdfFile] = useState(null);
    const [isPdfMode, setIsPdfMode] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [questions, setQuestions] = useState([]);
    const [activeStandards, setActiveStandards] = useState([]);

    const getImageUrl = getFileUrl;

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
    };

    // Fetched without skip/limit so the whole list is in memory: search and the
    // standard/subject/medium filters run on the client across every exam, not
    // just the current page.
    const loadExams = () => {
        setLoading(true);
        api.get('/truefalseexam/all', { noPrefix: true })
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addQuestion = () => {
        const marks = parseInt(formData.totalMarks) || 0;
        if (questions.length >= marks) {
            return showToast(`You cannot add more than ${marks} questions based on Total Marks selected.`, "error");
        }
        setQuestions([...questions, { questionText: '', questionImage: null, answer: '' }]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
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

    const handlePdfUpload = async () => {
        if (!pdfFile) return showToast("Please select a file first", "error");
        
        // Strict PDF validation since backend currently only extracts PDFs
        if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
            return showToast("Invalid file type. Only PDF files are supported for extraction.", "error");
        }
        
        setPdfLoading(true);
        const uploadData = new FormData();
        uploadData.append('file', pdfFile);

        try {
            const response = await api.post('/truefalseexam/upload-pdf', uploadData, {
                noPrefix: true,
                isMultipart: true
            });
            
            showToast("PDF parsed successfully. Review data below.");
            setFormData(prev => ({
                ...prev,
                overview: response.overview || prev.overview
            }));

            if (response.questions && response.questions.length > 0) {
                const parsedQs = response.questions.map(q => ({
                    questionText: q.questionText || '',
                    questionImage: null,
                    answer: q.correctAnswer === 'True' || q.correctAnswer === 'False' ? q.correctAnswer : ''
                }));
                // Pad to totalMarks if needed
                const marks = parseInt(formData.totalMarks) || response.questions.length;
                while (parsedQs.length < marks) {
                    parsedQs.push({ questionText: '', questionImage: null, answer: '' });
                }
                setQuestions(parsedQs);
                if (!formData.totalMarks) {
                     setFormData(prev => ({ ...prev, totalMarks: marks.toString() }));
                }
            }
            setIsPdfMode(false); // Switch to manual review mode
        } catch (err) {
            showToast('Failed to process PDF: ' + err.message, 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleEdit = (exam) => {
        setEditingExam(exam._id);
        setFormData({
            title: exam.title || '',
            board: exam.board || 'GSEB',
            std: exam.std || '',
            medium: exam.medium || 'English',
            stream: exam.stream || 'None',
            subject: exam.subject || '',
            unit: exam.unit || '',
            totalMarks: exam.totalMarks || '',
            overview: exam.overview || ''
        });

        const mappedQuestions = (exam.questions || []).map(q => {
            let ans = q.correctAnswer || '';
            if (ans === 'A' || ans === 'Option A') ans = 'True';
            if (ans === 'B' || ans === 'Option B') ans = 'False';

            return {
                questionText: q.question || '',
                questionImage: q.questionImage || null,
                answer: ans
            };
        });

        setQuestions(mappedQuestions.length > 0 ? mappedQuestions : Array(parseInt(exam.totalMarks) || 0).fill({ questionText: '', questionImage: null, answer: '' }));
        setIsPdfMode(false);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.title) return showToast("Exam Title is required.", "error");
        if (!formData.std) return showToast("Standard is required.", "error");
        if (!formData.subject) return showToast("Subject is required.", "error");
        if (!formData.unit) return showToast("Unit is required.", "error");
        if (!formData.totalMarks) return showToast("Total Marks is required.", "error");
        if (!formData.overview && !isPdfMode) return showToast("Overview is required.", "error");

        if (questions.length === 0) {
            return showToast("Please add at least one question.", "error");
        }
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].questionText && !questions[i].questionImage) {
                return showToast(`Question ${i + 1} must have text or image.`, "error");
            }
            if (!questions[i].answer) {
                return showToast(`Question ${i + 1} must have an answer (True/False).`, "error");
            }
        }

        try {
            const payload = {
                ...formData,
                questions: questions.map(q => ({
                    question: q.questionText,
                    questionImage: q.questionImage,
                    type: 'True/False',
                    optionA: 'True',
                    optionB: 'False',
                    correctAnswer: q.answer
                }))
            };

            if (editingExam) {
                await api.put(`/truefalseexam/update/${editingExam}`, payload, { noPrefix: true });
                showToast('True/False Exam updated successfully!');
            } else {
                await api.post('/truefalseexam/create', payload, { noPrefix: true });
                showToast('True/False Exam created successfully!');
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
            await api.del(`/truefalseexam/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams();
            showToast('Exam deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div class="materials-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Exams</div>
                    <h1>True / False Exams</h1>
                    <p class="page-subtitle">Binary-choice exams to test conceptual understanding.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{totalCount.toLocaleString()}</span>
                            <span class="hm-label">Total Exams</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={() => loadExams()}>
                        <Icons.Refresh /> Refresh
                    </button>
                    <button class="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Icons.Plus /> Add New Exam
                    </button>
                </div>
            </div>

            <div class="table-container">
                <ExamFilterBar {...filters.bar} searchPlaceholder="Search exam, subject, unit…" />

                {loading ? (
                    <div class="loading-spinner" />
                ) : exams.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Reports /></div>
                        <h3>No True/False exams yet</h3>
                        <p>Add your first True/False exam to get started.</p>
                    </div>
                ) : filters.filteredCount === 0 ? (
                    <NoFilterMatches onClear={filters.clear} />
                ) : (
                    <>
                        <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Exam</th>
                                    <th>Subject</th>
                                    <th>Standard</th>
                                    <th>Medium</th>
                                    <th>Unit</th>
                                    <th>Marks</th>
                                    <th>Questions</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filters.visible.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div class="identity">
                                                <div class="avatar avatar-sm" style={{ background: 'var(--chart-red)' }}><Icons.Success /></div>
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
                                        <td style="font-weight:600;color:var(--text-primary);">{item.totalMarks}</td>
                                        <td><span class="badge badge-neutral">{item.questions?.length || 0} Qs</span></td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                <button class="icon-btn primary" onClick={() => handleEdit(item)} title="Edit Exam">
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
                            <h3>{editingExam ? 'Edit True/False Exam' : 'Add True/False Exam'}</h3>
                            <button class="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="exam-form" style="display: flex; flex-direction: column; gap: 2rem;">
                                <div style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                    <h4 style="margin: 0 0 1.5rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                        Exam Details
                                    </h4>
                                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Title *</label>
                                            <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. Science Chapter 1 True False" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
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
                                                {activeStandards.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
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
                                                {(() => {
                                                    let subjectKey = `${formData.board}-${formData.std}`;
                                                    if (formData.std === '11' || formData.std === '12') {
                                                        subjectKey += `-${formData.stream}`;
                                                    }
                                                    const availableSubjects = AcademicConstants.subjects[subjectKey] || [];
                                                    return availableSubjects.map(sub => <option value={sub}>{sub}</option>);
                                                })()}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Unit *</label>
                                            <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Total Marks *</label>
                                            <select name="totalMarks" value={formData.totalMarks} onChange={(e) => {
                                                handleInputChange(e);
                                                if (!editingExam && !isPdfMode) {
                                                    const marks = parseInt(e.target.value) || 0;
                                                    const newQs = [...questions];
                                                    if (marks > newQs.length) {
                                                        while(newQs.length < marks) newQs.push({ questionText: '', questionImage: null, answer: '' });
                                                    } else if (marks < newQs.length) {
                                                        newQs.length = marks;
                                                    }
                                                    setQuestions(newQs);
                                                }
                                            }} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                <option value="">Select Marks</option>
                                                {AcademicConstants.marks?.map(m => <option value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="questions-section" style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                            Questions Setup
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
                                            <Icons.Reports size={48} style="color: var(--accent); margin-bottom: 1rem;" />
                                            <h5 style="margin-bottom: 1rem;">Upload Exam PDF</h5>
                                            <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
                                                The PDF should contain an 'Overview' section followed by numbered True/False questions.
                                            </p>
                                            <input 
                                                type="file" 
                                                accept=".pdf" 
                                                onChange={(e) => setPdfFile(e.target.files[0])} 
                                                style="margin-bottom: 1rem; width: 100%; max-width: 300px;" 
                                            />
                                            <br />
                                            <button 
                                                class="btn btn-primary" 
                                                onClick={handlePdfUpload}
                                                disabled={!pdfFile || pdfLoading}
                                            >
                                                {pdfLoading ? 'Processing PDF...' : 'Process PDF'}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div class="form-group" style="margin-bottom: 2rem;">
                                                <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Chapter Overview / Study Material *</label>
                                                <textarea 
                                                    name="overview" 
                                                    value={formData.overview} 
                                                    onInput={handleInputChange} 
                                                    placeholder="Enter the overview text here..." 
                                                    style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem; min-height: 120px;" 
                                                />
                                            </div>

                                            {(!formData.totalMarks) ? (
                                                <div style="text-align: center; padding: 2rem; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 8px;">
                                                    Please select Total Marks to begin adding questions.
                                                </div>
                                            ) : (
                                                <>
                                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                                        <h5 style="margin: 0; font-size: 0.95rem; font-weight: 600;">Question List ({questions.length})</h5>
                                                        <button class="btn btn-sm btn-outline" onClick={addQuestion}><Icons.Plus /> Add Question</button>
                                                    </div>
                                                    
                                                    <div style="max-height: 50vh; overflow-y: auto;">
                                                        {questions.map((q, qIndex) => (
                                                            <div key={qIndex} style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 1.5rem; background: var(--bg-primary);">
                                                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                                                                    <strong style="font-size: 1.1rem; color: var(--primary-color);">Question {qIndex + 1}</strong>
                                                                    <button class="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIndex)}><Icons.Trash /></button>
                                                                </div>
                                                                <div class="form-group">
                                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Question Text</label>
                                                                    <input type="text" class="form-control" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);" placeholder="Enter question text..." value={q.questionText} onInput={(e) => updateQuestion(qIndex, 'questionText', e.target.value)} />
                                                                </div>
                                                                <div class="image-upload-row" style="display: flex; align-items: center; gap: 1rem; margin: 1rem 0;">
                                                                    <label class="btn btn-sm btn-outline" style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                                                        <Icons.Image /> {q.questionImage ? 'Change Image' : 'Add Image'}
                                                                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                                            const url = await handleImageUpload(e.target.files[0]);
                                                                            if (url) updateQuestion(qIndex, 'questionImage', url);
                                                                        }} />
                                                                    </label>
                                                                    {q.questionImage && (
                                                                        <div style="display: flex; align-items: center; gap: 4px;">
                                                                            <img src={getImageUrl(q.questionImage)} style="height: 40px; border-radius: 4px;" />
                                                                            <button class="btn-close-sm" onClick={() => updateQuestion(qIndex, 'questionImage', null)}>&times;</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div class="form-group">
                                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Correct Answer</label>
                                                                    <div style="display: flex; gap: 2rem;">
                                                                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`ans-${qIndex}`} 
                                                                                checked={q.answer === 'True'}
                                                                                onChange={() => updateQuestion(qIndex, 'answer', 'True')} 
                                                                            />
                                                                            True
                                                                        </label>
                                                                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`ans-${qIndex}`} 
                                                                                checked={q.answer === 'False'}
                                                                                onChange={() => updateQuestion(qIndex, 'answer', 'False')} 
                                                                            />
                                                                            False
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                            {!isPdfMode && (
                                <button class="btn btn-primary" onClick={handleSave}>{editingExam ? 'Update Exam' : 'Save Exam'}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Exam</h3>
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
