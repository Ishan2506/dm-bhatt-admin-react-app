import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { AdvancedDateTimePicker } from '../components/AdvancedDateTimePicker';
import { AcademicConstants } from '../utils/constants';
import { getLiveSocket } from '../liveSocket';

const STATUS_META = {
    DRAFT: { label: 'Draft', cls: 'badge-neutral' },
    SCHEDULED: { label: 'Scheduled', cls: 'badge-info' },
    QUEUE_OPEN: { label: 'Queue Open', cls: 'badge-warning' },
    LIVE: { label: 'Live', cls: 'badge-success' },
    COMPLETED: { label: 'Completed', cls: 'badge-neutral' },
    CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
};

const INITIAL_FORM = {
    title: '',
    description: '',
    instructions: '',
    board: 'GSEB',
    std: '',
    medium: 'English',
    stream: 'None',
    subject: '',
    startAt: '',
    durationMinutes: '30',
    queueOpensBeforeMinutes: '30',
    passingMarks: '0',
};

const pad = (n) => String(n).padStart(2, '0');

/** ISO -> "YYYY-MM-DDTHH:mm" in the browser's local time (picker format). */
const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (iso) => iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : '—';

const formatDuration = (ms) => {
    if (ms === null || ms === undefined) return '—';
    const total = Math.round(ms / 1000);
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    return d > 0 ? `${d}d ${hms}` : hms;
};

const inputStyle = 'width: 100%;';

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, cls: 'badge-neutral' };
    return <span class={`badge ${meta.cls}`}>{meta.label}</span>;
}

export function LiveExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [allSubjects, setAllSubjects] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);

    // Question picker (existing Online Exams = question bank)
    const [sourceExams, setSourceExams] = useState([]);
    const [loadingSources, setLoadingSources] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [questionsByExam, setQuestionsByExam] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const [questionMarks, setQuestionMarks] = useState({});
    const [questionSource, setQuestionSource] = useState({});

    const [confirm, setConfirm] = useState(null);
    const [monitor, setMonitor] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadExams = () => {
        setLoading(true);
        api.get('/liveexam/admin/all', { noPrefix: true })
            .then((res) => setExams(Array.isArray(res) ? res : []))
            .catch((err) => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams();
        api.get('/subjects')
            .then((res) => setAllSubjects(Array.isArray(res) ? res : res.data || []))
            .catch((err) => console.error('Failed to load subjects:', err));
    }, []);

    // Same subject filtering as the Online Exams form.
    const filteredSubjects = allSubjects.filter((subject) => {
        const subjectStd = subject.standardId?.name || subject.std || '';
        const subjectStream = subject.stream || 'None';
        const matchStd = form.std === '' || subjectStd.includes(form.std);
        const matchStream = form.stream === 'None' || subjectStream === form.stream || subjectStream === 'None';
        return matchStd && matchStream;
    });

    // Load candidate Online Exams once the class + subject are chosen.
    useEffect(() => {
        if (!showForm || !form.std || !form.subject || !form.board || !form.medium) {
            setSourceExams([]);
            return;
        }
        const params = new URLSearchParams({ std: form.std, subject: form.subject, board: form.board, medium: form.medium });
        setLoadingSources(true);
        api.get(`/exam/all?${params.toString()}`, { noPrefix: true })
            .then((res) => setSourceExams(Array.isArray(res) ? res : res.data || []))
            .catch((err) => showToast(err.message, 'error'))
            .finally(() => setLoadingSources(false));
    }, [showForm, form.std, form.subject, form.board, form.medium]);

    const loadQuestionsFor = async (examId) => {
        if (questionsByExam[examId]) return questionsByExam[examId];
        const exam = await api.get(`/exam/${examId}?original=true`, { noPrefix: true });
        const qs = exam.questions || [];
        setQuestionsByExam((prev) => ({ ...prev, [examId]: qs }));
        setQuestionMarks((prev) => {
            const next = { ...prev };
            qs.forEach((q) => { next[q._id] = Number(q.marks) > 0 ? Number(q.marks) : 1; });
            return next;
        });
        setQuestionSource((prev) => {
            const next = { ...prev };
            qs.forEach((q) => { next[q._id] = examId; });
            return next;
        });
        return qs;
    };

    const toggleExpand = async (examId) => {
        const open = !expanded[examId];
        setExpanded((prev) => ({ ...prev, [examId]: open }));
        if (open) {
            try {
                await loadQuestionsFor(examId);
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    };

    const toggleQuestion = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const selectAllFrom = async (examId, select) => {
        try {
            const qs = await loadQuestionsFor(examId);
            const ids = qs.map((q) => q._id);
            setSelectedIds((prev) => (select
                ? [...prev, ...ids.filter((id) => !prev.includes(id))]
                : prev.filter((id) => !ids.includes(id))));
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const selectedMarks = selectedIds.reduce((sum, id) => sum + (questionMarks[id] || 1), 0);

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setEditing(null);
        setSelectedIds([]);
        setQuestionMarks({});
        setQuestionSource({});
        setExpanded({});
        setQuestionsByExam({});
        setSourceExams([]);
    };

    const openCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const openEdit = async (item) => {
        resetForm();
        try {
            const detail = await api.get(`/liveexam/admin/${item._id}`, { noPrefix: true });
            setEditing(detail);
            setForm({
                title: detail.title || '',
                description: detail.description || '',
                instructions: detail.instructions || '',
                board: detail.board || 'GSEB',
                std: detail.std || '',
                medium: detail.medium || 'English',
                stream: detail.stream || 'None',
                subject: detail.subject || '',
                startAt: toLocalInput(detail.startAt),
                durationMinutes: String(detail.durationMinutes || 30),
                queueOpensBeforeMinutes: String(detail.queueOpensBeforeMinutes ?? 30),
                passingMarks: String(detail.passingMarks || 0),
            });
            const qs = (detail.questions || []).filter(Boolean);
            setSelectedIds(qs.map((q) => q._id));
            const marks = {};
            const source = {};
            qs.forEach((q) => {
                marks[q._id] = Number(q.marks) > 0 ? Number(q.marks) : 1;
                source[q._id] = q.examId;
            });
            setQuestionMarks(marks);
            setQuestionSource(source);
            setShowForm(true);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'board') { next.std = ''; next.subject = ''; }
            if (name === 'std') { next.subject = ''; }
            return next;
        });
    };

    const isLive = editing && editing.status === 'LIVE';

    const handleSave = async (schedule) => {
        if (!isLive) {
            if (!form.title.trim()) return showToast('Exam name is required', 'error');
            if (!form.std || !form.subject) return showToast('Select standard and subject', 'error');
            if (!form.startAt) return showToast('Select exam date and start time', 'error');
            if (schedule && selectedIds.length === 0) return showToast('Select at least one question', 'error');
            if (schedule && new Date(form.startAt).getTime() <= Date.now()) return showToast('Start time must be in the future', 'error');
            if (Number(form.passingMarks) > selectedMarks) return showToast('Passing marks cannot exceed total marks', 'error');
        }

        const payload = {
            ...form,
            startAt: form.startAt ? new Date(form.startAt).toISOString() : '',
            durationMinutes: Number(form.durationMinutes),
            queueOpensBeforeMinutes: Number(form.queueOpensBeforeMinutes),
            passingMarks: Number(form.passingMarks) || 0,
            questionIds: selectedIds,
            sourceExamIds: [...new Set(selectedIds.map((id) => questionSource[id]).filter(Boolean))],
        };

        setSaving(true);
        try {
            if (editing) {
                await api.put(`/liveexam/admin/update/${editing._id}`, payload, { noPrefix: true });
                if (schedule && editing.adminStatus === 'DRAFT') {
                    await api.put(`/liveexam/admin/${editing._id}/publish`, {}, { noPrefix: true });
                }
                showToast(schedule && editing.adminStatus === 'DRAFT' ? 'Live exam scheduled' : 'Live exam updated');
            } else {
                await api.post('/liveexam/admin/create', { ...payload, status: schedule ? 'SCHEDULED' : 'DRAFT' }, { noPrefix: true });
                showToast(schedule ? 'Live exam scheduled' : 'Draft saved');
            }
            setShowForm(false);
            resetForm();
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const publish = async (item) => {
        try {
            await api.put(`/liveexam/admin/${item._id}/publish`, {}, { noPrefix: true });
            showToast('Live exam scheduled');
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const runConfirm = async () => {
        const { type, exam } = confirm;
        try {
            if (type === 'cancel') {
                await api.put(`/liveexam/admin/${exam._id}/cancel`, {}, { noPrefix: true });
                showToast('Live exam cancelled');
            } else {
                await api.del(`/liveexam/admin/delete/${exam._id}`, { noPrefix: true });
                showToast('Live exam deleted');
            }
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setConfirm(null);
        }
    };

    const liveCount = exams.filter((e) => e.status === 'LIVE').length;
    const upcomingCount = exams.filter((e) => e.status === 'SCHEDULED' || e.status === 'QUEUE_OPEN').length;

    return (
        <div class="materials-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Exams</div>
                    <h1>Live Arena</h1>
                    <p class="page-subtitle">Schedule live exams that every student sits at the same time, with a waiting queue and a live leaderboard.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{exams.length.toLocaleString()}</span>
                            <span class="hm-label">Total</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{upcomingCount}</span>
                            <span class="hm-label">Upcoming</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{liveCount}</span>
                            <span class="hm-label">Live Now</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={loadExams}>
                        <Icons.Refresh /> Refresh
                    </button>
                    <button class="btn btn-primary" onClick={openCreate}>
                        <Icons.Plus /> Schedule Live Exam
                    </button>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : exams.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Clock /></div>
                        <h3>No live exams yet</h3>
                        <p>Schedule a live exam using questions from your Online Exams.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Exam</th>
                                    <th>Class</th>
                                    <th>Schedule</th>
                                    <th>Paper</th>
                                    <th>Status</th>
                                    <th>Queue / Online</th>
                                    <th>Submitted</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map((item) => {
                                    const canEdit = ['DRAFT', 'SCHEDULED', 'QUEUE_OPEN', 'LIVE'].includes(item.status);
                                    const canCancel = ['DRAFT', 'SCHEDULED', 'QUEUE_OPEN', 'LIVE'].includes(item.status);
                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <div class="identity">
                                                    <div class="avatar avatar-sm" style={{ background: 'var(--primary)' }}><Icons.Clock /></div>
                                                    <div class="identity-body">
                                                        <div class="identity-name">{item.title}</div>
                                                        <div class="identity-sub">{item.subject}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="cell-chip">{item.std}</span>
                                                <div style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:4px;">{item.board} · {item.medium}</div>
                                            </td>
                                            <td style="font-size:var(--font-xs);">
                                                <div style="font-weight:600;color:var(--text-primary);">{formatDateTime(item.startAt)}</div>
                                                <div style="color:var(--text-secondary);">{item.durationMinutes} min</div>
                                            </td>
                                            <td>{item.questionCount} Q · {item.totalMarks} marks</td>
                                            <td><StatusBadge status={item.status} /></td>
                                            <td>{item.queueCount} / {item.onlineCount}</td>
                                            <td>{item.submittedCount}</td>
                                            <td>
                                                <div class="td-actions" style="justify-content:flex-end;">
                                                    {item.status !== 'DRAFT' && (
                                                        <button class="icon-btn primary" onClick={() => setMonitor(item)} title="Monitor">
                                                            <Icons.Eye />
                                                        </button>
                                                    )}
                                                    {item.status === 'DRAFT' && (
                                                        <button class="icon-btn primary" onClick={() => publish(item)} title="Schedule">
                                                            <Icons.Calendar />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button class="icon-btn primary" onClick={() => openEdit(item)} title="Edit">
                                                            <Icons.Edit />
                                                        </button>
                                                    )}
                                                    {canCancel && (
                                                        <button class="icon-btn danger" onClick={() => setConfirm({ type: 'cancel', exam: item })} title="Cancel exam">
                                                            <Icons.Error />
                                                        </button>
                                                    )}
                                                    {item.status !== 'LIVE' && item.submittedCount === 0 && (
                                                        <button class="icon-btn danger" onClick={() => setConfirm({ type: 'delete', exam: item })} title="Delete">
                                                            <Icons.Trash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>{editing ? 'Edit Live Exam' : 'Schedule Live Exam'}</h3>
                            <button class="modal-close" onClick={() => { setShowForm(false); resetForm(); }}>&times;</button>
                        </div>
                        <div class="modal-body">
                            {isLive && (
                                <div class="badge badge-warning" style="display:block;padding:0.75rem 1rem;margin-bottom:1rem;white-space:normal;">
                                    This exam is live. Only the name, description and instructions can be changed.
                                </div>
                            )}
                            <div style="display:flex;flex-direction:column;gap:1.5rem;">
                                <div class="card" style="padding:1.5rem;">
                                    <h4 style="margin:0 0 1rem 0;">Exam Details</h4>
                                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                                        <div class="form-group" style="grid-column: span 2;">
                                            <label>Exam Name *</label>
                                            <input class="form-control" name="title" value={form.title} onInput={handleInput} placeholder="e.g. Science Challenge - Round 1" style={inputStyle} />
                                        </div>
                                        <div class="form-group" style="grid-column: span 2;">
                                            <label>Description</label>
                                            <textarea class="form-control" name="description" rows="2" value={form.description} onInput={handleInput} style={inputStyle} />
                                        </div>
                                        <div class="form-group">
                                            <label>Board *</label>
                                            <select class="form-control" name="board" value={form.board} onChange={handleInput} disabled={isLive}>
                                                {AcademicConstants.boards.map((b) => <option value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Standard *</label>
                                            <select class="form-control" name="std" value={form.std} onChange={handleInput} disabled={isLive}>
                                                <option value="">Select Standard</option>
                                                {AcademicConstants.standards[form.board]?.map((s) => <option value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Medium *</label>
                                            <select class="form-control" name="medium" value={form.medium} onChange={handleInput} disabled={isLive}>
                                                {AcademicConstants.mediums.map((m) => <option value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        {(form.std === '11' || form.std === '12') && (
                                            <div class="form-group">
                                                <label>Stream *</label>
                                                <select class="form-control" name="stream" value={form.stream} onChange={handleInput} disabled={isLive}>
                                                    {AcademicConstants.streams.map((s) => <option value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div class="form-group">
                                            <label>Subject *</label>
                                            <select class="form-control" name="subject" value={form.subject} onChange={handleInput} disabled={isLive}>
                                                <option value="">Select Subject</option>
                                                {filteredSubjects.map((sub) => <option value={sub.name || sub._id}>{sub.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="card" style="padding:1.5rem;">
                                    <h4 style="margin:0 0 1rem 0;">Schedule</h4>
                                    {isLive ? (
                                        <p style="margin:0;color:var(--text-secondary);">{formatDateTime(editing.startAt)} · {editing.durationMinutes} min</p>
                                    ) : (
                                        <Fragment>
                                            <AdvancedDateTimePicker
                                                value={form.startAt}
                                                onChange={(value) => setForm((prev) => ({ ...prev, startAt: value }))}
                                                label="Exam Date & Start Time *"
                                            />
                                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1rem;">
                                                <div class="form-group">
                                                    <label>Duration (minutes) *</label>
                                                    <input class="form-control" type="number" min="1" max="600" name="durationMinutes" value={form.durationMinutes} onInput={handleInput} />
                                                </div>
                                                <div class="form-group">
                                                    <label>Queue opens (min before)</label>
                                                    <input class="form-control" type="number" min="0" max="1440" name="queueOpensBeforeMinutes" value={form.queueOpensBeforeMinutes} onInput={handleInput} />
                                                </div>
                                                <div class="form-group">
                                                    <label>Passing Marks</label>
                                                    <input class="form-control" type="number" min="0" name="passingMarks" value={form.passingMarks} onInput={handleInput} />
                                                </div>
                                            </div>
                                            {form.startAt && Number(form.durationMinutes) > 0 && (
                                                <p style="margin:0.75rem 0 0 0;font-size:var(--font-xs);color:var(--text-secondary);">
                                                    Ends at {formatDateTime(new Date(new Date(form.startAt).getTime() + Number(form.durationMinutes) * 60000).toISOString())}
                                                </p>
                                            )}
                                        </Fragment>
                                    )}
                                </div>

                                <div class="card" style="padding:1.5rem;">
                                    <h4 style="margin:0 0 0.25rem 0;">Questions</h4>
                                    <p style="margin:0 0 1rem 0;font-size:var(--font-xs);color:var(--text-secondary);">
                                        Picked from your existing Online Exams. <strong>{selectedIds.length}</strong> selected · <strong>{selectedMarks}</strong> total marks
                                    </p>
                                    {isLive ? null : !form.std || !form.subject ? (
                                        <p style="margin:0;color:var(--text-secondary);">Select standard and subject to see available exams.</p>
                                    ) : loadingSources ? (
                                        <div class="loading-spinner" />
                                    ) : sourceExams.length === 0 ? (
                                        <p style="margin:0;color:var(--text-secondary);">No Online Exams found for this class and subject.</p>
                                    ) : (
                                        <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:360px;overflow:auto;">
                                            {sourceExams.map((src) => {
                                                const qs = questionsByExam[src._id] || [];
                                                const chosen = qs.filter((q) => selectedIds.includes(q._id)).length;
                                                return (
                                                    <div key={src._id} style="border:1px solid var(--border-color);border-radius:8px;">
                                                        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.9rem;">
                                                            <button class="btn btn-outline" style="padding:0.25rem 0.6rem;" onClick={() => toggleExpand(src._id)}>
                                                                {expanded[src._id] ? '−' : '+'}
                                                            </button>
                                                            <div style="flex:1;min-width:0;">
                                                                <div style="font-weight:600;">{src.title}</div>
                                                                <div style="font-size:var(--font-xs);color:var(--text-secondary);">{src.unit} · {src.questions?.length || 0} questions{chosen ? ` · ${chosen} selected` : ''}</div>
                                                            </div>
                                                            <button class="btn btn-outline" style="padding:0.25rem 0.6rem;" onClick={() => selectAllFrom(src._id, true)}>Select all</button>
                                                            <button class="btn btn-outline" style="padding:0.25rem 0.6rem;" onClick={() => selectAllFrom(src._id, false)}>Clear</button>
                                                        </div>
                                                        {expanded[src._id] && (
                                                            <div style="border-top:1px solid var(--border-color);padding:0.5rem 0.9rem;">
                                                                {qs.length === 0 ? (
                                                                    <p style="margin:0;color:var(--text-secondary);">Loading…</p>
                                                                ) : qs.map((q, i) => (
                                                                    <label key={q._id} style="display:flex;gap:0.6rem;align-items:flex-start;padding:0.35rem 0;cursor:pointer;">
                                                                        <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggleQuestion(q._id)} />
                                                                        <span style="flex:1;">{i + 1}. {q.questionText || '(image question)'}</span>
                                                                        <span style="font-size:var(--font-xs);color:var(--text-secondary);">{Number(q.marks) > 0 ? q.marks : 1} mk</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div class="card" style="padding:1.5rem;">
                                    <div class="form-group">
                                        <label>Exam Instructions</label>
                                        <textarea class="form-control" name="instructions" rows="4" value={form.instructions} onInput={handleInput} placeholder="Shown to students before they start" style={inputStyle} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={saving}>Cancel</button>
                            {(!editing || editing.adminStatus === 'DRAFT') && (
                                <button class="btn btn-outline" onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
                            )}
                            <button class="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
                                {saving ? 'Saving…' : editing && editing.adminStatus !== 'DRAFT' ? 'Save Changes' : 'Schedule Exam'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>{confirm.type === 'cancel' ? 'Cancel Live Exam' : 'Delete Live Exam'}</h3>
                            <button class="modal-close" onClick={() => setConfirm(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>
                                {confirm.type === 'cancel'
                                    ? <Fragment>Cancel <strong>"{confirm.exam.title}"</strong>? Students will see it as cancelled and pending reminders will not be sent.</Fragment>
                                    : <Fragment>Delete <strong>"{confirm.exam.title}"</strong>?</Fragment>}
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => setConfirm(null)}>Back</button>
                            <button class="btn btn-danger" onClick={runConfirm}>{confirm.type === 'cancel' ? 'Cancel Exam' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}

            {monitor && <LiveExamMonitor exam={monitor} onClose={() => { setMonitor(null); loadExams(); }} />}

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

const PAGE_SIZE = 25;

function LiveExamMonitor({ exam, onClose }) {
    const [stats, setStats] = useState({
        queueCount: exam.queueCount,
        onlineCount: exam.onlineCount,
        status: exam.status,
        startAt: exam.startAt,
        endAt: exam.endAt,
    });
    const [clockOffset, setClockOffset] = useState(0);
    const [now, setNow] = useState(Date.now());
    const [tab, setTab] = useState('leaderboard');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ entries: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const tabRef = useRef(tab);
    const pageRef = useRef(page);
    tabRef.current = tab;
    pageRef.current = page;

    const load = () => {
        setLoading(true);
        const path = tab === 'leaderboard'
            ? `/liveexam/${exam._id}/leaderboard?page=${page}&limit=${PAGE_SIZE}`
            : `/liveexam/admin/${exam._id}/${tab}?page=${page}&limit=${PAGE_SIZE}`;
        api.get(path, { noPrefix: true })
            .then((res) => setData({ entries: res.entries || [], total: res.total || 0 }))
            .catch(() => setData({ entries: [], total: 0 }))
            .finally(() => setLoading(false));
    };

    useEffect(load, [tab, page]);

    // Live counts, status and leaderboard over Socket.IO.
    useEffect(() => {
        const socket = getLiveSocket();
        const examId = String(exam._id);
        const syncClock = (serverTime) => serverTime && setClockOffset(new Date(serverTime).getTime() - Date.now());

        const joinRoom = () => socket.emit('liveExam:join', { examId }, (res) => {
            if (res && res.ok) {
                setStats((prev) => ({ ...prev, ...res }));
                syncClock(res.serverTime);
            }
        });
        const onStats = (p) => {
            if (p.examId !== examId) return;
            setStats((prev) => ({ ...prev, ...p }));
            syncClock(p.serverTime);
        };
        const onStatus = (p) => {
            if (p.examId !== examId) return;
            setStats((prev) => ({ ...prev, status: p.status, startAt: p.startAt, endAt: p.endAt }));
        };
        const onBoard = (p) => {
            if (p.examId === examId && tabRef.current === 'leaderboard' && pageRef.current === 1) load();
        };

        socket.on('connect', joinRoom);
        socket.on('liveExam:stats', onStats);
        socket.on('liveExam:status', onStatus);
        socket.on('liveExam:leaderboard', onBoard);
        if (socket.connected) joinRoom();

        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(timer);
            socket.emit('liveExam:leave', { examId });
            socket.off('connect', joinRoom);
            socket.off('liveExam:stats', onStats);
            socket.off('liveExam:status', onStatus);
            socket.off('liveExam:leaderboard', onBoard);
        };
    }, [exam._id]);

    const serverNow = now + clockOffset;
    const countdown = stats.status === 'LIVE'
        ? { label: 'Ends in', value: formatCountdown(new Date(stats.endAt).getTime() - serverNow) }
        : (stats.status === 'SCHEDULED' || stats.status === 'QUEUE_OPEN')
            ? { label: 'Starts in', value: formatCountdown(new Date(stats.startAt).getTime() - serverNow) }
            : { label: 'Status', value: STATUS_META[stats.status]?.label || stats.status };

    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

    return (
        <div class="modal-overlay">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>{exam.title} <StatusBadge status={stats.status} /></h3>
                    <button class="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stat-grid" style="margin-bottom:1.25rem;">
                        <div class="stat-card blue">
                            <div class="stat-info"><div class="stat-label">Waiting Queue</div><div class="stat-value">{stats.queueCount}</div></div>
                        </div>
                        <div class="stat-card green">
                            <div class="stat-info"><div class="stat-label">Currently Online</div><div class="stat-value">{stats.onlineCount}</div></div>
                        </div>
                        <div class="stat-card orange">
                            <div class="stat-info"><div class="stat-label">{countdown.label}</div><div class="stat-value">{countdown.value}</div></div>
                        </div>
                    </div>

                    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
                        {[['leaderboard', 'Leaderboard'], ['queue', 'Queue'], ['participants', 'Participants']].map(([key, label]) => (
                            <button key={key} class={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setTab(key); setPage(1); }}>{label}</button>
                        ))}
                        <button class="btn btn-outline" style="margin-left:auto;" onClick={load}><Icons.Refresh /> Refresh</button>
                    </div>

                    {loading ? (
                        <div class="loading-spinner" />
                    ) : data.entries.length === 0 ? (
                        <div class="table-empty"><p>Nothing here yet.</p></div>
                    ) : (
                        <div class="table-scroll">
                            <table>
                                {tab === 'leaderboard' && (
                                    <Fragment>
                                        <thead><tr><th>Rank</th><th>Student</th><th>Marks</th><th>Time</th><th>Submitted</th></tr></thead>
                                        <tbody>
                                            {data.entries.map((e) => (
                                                <tr key={e.attemptId}>
                                                    <td><strong>#{e.rank}</strong></td>
                                                    <td>{e.name}</td>
                                                    <td style="font-weight:600;">{e.obtainedMarks} / {e.totalMarks}</td>
                                                    <td>{formatDuration(e.timeTakenMs)}</td>
                                                    <td style="font-size:var(--font-xs);">{formatDateTime(e.submittedAt)}{e.status === 'AUTO_SUBMITTED' ? ' (auto)' : ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Fragment>
                                )}
                                {tab === 'queue' && (
                                    <Fragment>
                                        <thead><tr><th>#</th><th>Student</th><th>Phone</th><th>Joined</th><th>Online</th></tr></thead>
                                        <tbody>
                                            {data.entries.map((e) => (
                                                <tr key={e.studentId}>
                                                    <td>{e.position}</td>
                                                    <td>{e.name}</td>
                                                    <td>{e.phoneNum || '—'}</td>
                                                    <td style="font-size:var(--font-xs);">{formatDateTime(e.joinedAt)}</td>
                                                    <td>{e.online ? <span class="badge badge-success">Online</span> : <span class="badge badge-neutral">Offline</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Fragment>
                                )}
                                {tab === 'participants' && (
                                    <Fragment>
                                        <thead><tr><th>Student</th><th>First Attempt (ranked)</th><th>Status</th><th>Time</th><th>Attempts</th><th>Best Practice</th></tr></thead>
                                        <tbody>
                                            {data.entries.map((e) => (
                                                <tr key={e.studentId}>
                                                    <td>{e.name}</td>
                                                    <td style="font-weight:600;">{e.firstAttempt.status === 'IN_PROGRESS' ? '—' : `${e.firstAttempt.obtainedMarks} / ${e.firstAttempt.totalMarks}`}</td>
                                                    <td><span class={`badge ${e.firstAttempt.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-success'}`}>{e.firstAttempt.status.replace('_', ' ')}</span></td>
                                                    <td>{formatDuration(e.firstAttempt.timeTakenMs)}</td>
                                                    <td>{e.attempts}</td>
                                                    <td>{e.bestPracticeMarks ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Fragment>
                                )}
                            </table>
                        </div>
                    )}

                    {data.total > PAGE_SIZE && (
                        <div class="pagination">
                            <span>Page {page} of {totalPages} · {data.total} total</span>
                            <div class="pagination-controls">
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)}><Icons.ChevronLeft /></button>
                                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><Icons.ChevronRight /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
