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
    unit: ''
};

export function OneLinerExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingExam, setEditingExam] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Form State
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [questions, setQuestions] = useState([{ questionText: '', questionImage: null, answer: '' }]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setQuestions([{ questionText: '', questionImage: null, answer: '' }]);
        setEditingExam(null);
    };

    const loadExams = (page = 1) => {
        setLoading(true);
        const skip = (page - 1) * pageSize;
        api.get(`/onelinerexam/all?skip=${skip}&limit=${pageSize}`, { noPrefix: true })
            .then(response => {
                setExams(response.data || response);
                setTotalCount(response.total || response.length);
                setCurrentPage(page);
            })
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams(1);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', questionImage: null, answer: '' }]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
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
    const fetchOneLinerExamDetail = async (id) => {
        const candidates = [
            `/onelinerexam/${id}`,
            `/onelinerexam/get/${id}`,
            `/onelinerexam/view/${id}`,
            `/onelinerexam/details/${id}`
        ];
        for (const path of candidates) {
            try {
                const response = await api.get(path, { noPrefix: true });
                if (response && response.questions) {
                    return response;
                }
            } catch (e) {
                // Try next endpoint candidate
            }
        }
        return null;
    };
    const handleEdit = async (exam) => {
        let editableExam = exam;
        if (Array.isArray(exam.questions) && exam.questions.length > 0 && typeof exam.questions[0] === 'string') {
            const detail = await fetchOneLinerExamDetail(exam._id);
            if (detail) {
                editableExam = detail;
            } else {
                showToast('Could not load detailed one-liner exam data.', 'error');
            }
        }

        setEditingExam(editableExam._id);
        setFormData({
            title: editableExam.title || '',
            board: editableExam.board || 'GSEB',
            std: editableExam.std || '',
            medium: editableExam.medium || 'English',
            stream: editableExam.stream || 'None',
            subject: editableExam.subject || '',
            unit: editableExam.unit || ''
        });

        const mappedQuestions = (editableExam.questions || []).map(q => ({
            questionText: q?.questionText || q?.question || '',
            questionImage: q?.questionImage || q?.image || null,
            answer: q?.answer || q?.correctAnswer || ''
        }));

        setQuestions(mappedQuestions.length > 0 ? mappedQuestions : [{ questionText: '', questionImage: null, answer: '' }]);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.title) return showToast("Exam Title is required.", "error");
        if (!formData.std) return showToast("Standard is required.", "error");
        if (!formData.subject) return showToast("Subject is required.", "error");
        if (!formData.unit) return showToast("Unit is required.", "error");

        if (questions.length === 0) {
            return showToast("Please add at least one question.", "error");
        }
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].questionText && !questions[i].questionImage) {
                return showToast(`Question ${i + 1} must have text or image.`, "error");
            }
            if (!questions[i].answer) {
                return showToast(`Question ${i + 1} must have an answer.`, "error");
            }
        }

        try {
            const payload = {
                ...formData,
                questions: questions.map(q => ({
                    question: q.questionText,
                    questionImage: q.questionImage,
                    answer: q.answer
                }))
            };

            if (editingExam) {
                await api.put(`/onelinerexam/${editingExam}`, payload, { noPrefix: true });
                showToast('One Liner Exam updated successfully!');
            } else {
                await api.post('/onelinerexam/add', payload, { noPrefix: true });
                showToast('One Liner Exam created successfully!');
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
            await api.del(`/onelinerexam/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams(currentPage);
            showToast('Exam deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div class="materials-page">
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Reports /> One-Liner Exam History</h3>
                    <div class="table-actions">
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const newPageSize = parseInt(e.target.value);
                                setPageSize(newPageSize);
                                setCurrentPage(1);
                                const skip = 0;
                                api.get(`/onelinerexam/all?skip=${skip}&limit=${newPageSize}`, { noPrefix: true })
                                    .then(response => {
                                        setExams(response.data || response);
                                        setTotalCount(response.total || response.length);
                                    })
                                    .catch(err => showToast(err.message, 'error'));
                            }}
                            style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                        >
                            <option value={10}>10 per page</option>
                            <option value={25} selected>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}>
                            <Icons.Plus /> Add New Exam
                        </button>
                        <button class="btn btn-outline btn-sm" onClick={() => loadExams(currentPage)}>
                            <Icons.Refresh /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
                ) : exams.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No one-liner exams found.</p>
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Std</th>
                                    <th>Unit</th>
                                    <th>Questions</th>
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
                                        <td>{item.questions?.length || 0}</td>
                                        <td>
                                            <div class="td-actions">
                                                <button class="btn btn-outline btn-sm" onClick={() => handleEdit(item)} title="Edit Exam">
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
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: '1rem'; border-top: 1px solid var(--border); margin-top: 1.5rem; gap: 1rem;">
                            <span style="font-size: var(--font-sm); color: var(--text-secondary);">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} exams
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => loadExams(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ← Previous
                                </button>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => loadExams(pageNum)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: pageNum === currentPage ? 'none' : '1px solid var(--border)',
                                                        background: pageNum === currentPage ? 'var(--accent)' : 'transparent',
                                                        color: pageNum === currentPage ? 'white' : 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: 'var(--font-sm)',
                                                        fontWeight: pageNum === currentPage ? '600' : 'normal'
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            (pageNum === 2 && currentPage > 3) ||
                                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                        ) {
                                            return <span key={pageNum}>...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => loadExams(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showAddModal && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>{editingExam ? 'Edit One-Liner Exam' : 'Add One-Liner Exam'}</h3>
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
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Subject *</label>
                                            <input type="text" name="subject" value={formData.subject} onInput={handleInputChange} placeholder="e.g. English" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Unit *</label>
                                            <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                    </div>
                                </div>

                                <div class="questions-section" style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                            Questions
                                        </h4>
                                        <button class="btn btn-sm btn-primary" onClick={addQuestion}><Icons.Plus /> Add Question</button>
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
                                                            <img src={`http://103.212.121.139:5000/${q.questionImage}`} style="height: 40px; border-radius: 4px;" />
                                                            <button class="btn-close-sm" onClick={() => updateQuestion(qIndex, 'questionImage', null)}>&times;</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div class="form-group">
                                                    <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Answer</label>
                                                    <textarea class="form-control" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); min-height: 80px;" placeholder="Enter answer..." value={q.answer} onInput={(e) => updateQuestion(qIndex, 'answer', e.target.value)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave}>{editingExam ? 'Update Exam' : 'Save Exam'}</button>
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
