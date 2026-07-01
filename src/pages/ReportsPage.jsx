import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import './ReportsPage.css';

const BOARDS = ['GSEB', 'CBSE', 'ICSE', 'Other'];
const MEDIUMS = ['Gujarati', 'English', 'Hindi'];
const STREAMS = ['Science', 'Commerce', 'Arts', 'None'];
const EXAM_TYPES = [
    { id: 'COMBINED', label: 'All Combined' },
    { id: 'REGULAR', label: 'Regular Exams' },
    { id: 'QUIZ', label: 'Quiz' },
    { id: 'ONELINER', label: 'One Liner' }
];

export function ReportsPage({ section, type: initialType }) {
    const [view, setView] = useState(section === 'students' ? 'students' : 'exams');
    const [examType, setExamType] = useState(initialType || 'COMBINED');
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState({
        board: '',
        std: '',
        medium: '',
        stream: ''
    });

    useEffect(() => {
        // Fetch Standards for filter
        api.get('/standards')
            .then(data => setStandards(data))
            .catch(err => console.error('Failed to fetch standards:', err));
    }, []);

    useEffect(() => {
        if (section === 'students') {
            setView('students');
        } else {
            setView('exams');
            // Normalize type to uppercase to match EXAM_TYPES IDs
            const normalizedType = (initialType || 'COMBINED').toUpperCase();
            // Only set if it's a valid exam type, otherwise default to COMBINED
            if (EXAM_TYPES.some(t => t.id === normalizedType)) {
                setExamType(normalizedType);
            } else {
                setExamType('COMBINED');
            }
        }
    }, [section, initialType]);

    useEffect(() => {
        setCurrentPage(1);
        loadData(1);
    }, [view, examType, filters]);

    const loadData = (page = 1) => {
        setLoading(true);
        const skip = (page - 1) * pageSize;
        const query = new URLSearchParams();
        if (filters.board) query.append('board', filters.board);
        if (filters.std) query.append('std', filters.std);
        if (filters.medium) query.append('medium', filters.medium);
        if (filters.stream) query.append('stream', filters.stream);
        query.append('skip', skip);
        query.append('limit', pageSize);

        if (view === 'students') {
            console.log('Fetching student reports with query:', query.toString());
            api.get(`/reports/students?${query.toString()}`)
                .then(res => {
                    console.log('Student reports received:', res);
                    setData(res.data || res);
                    setTotalCount(res.total || res.length);
                    setCurrentPage(page);
                })
                .catch(err => {
                    console.error('Student reports failed:', err);
                })
                .finally(() => setLoading(false));
        } else {
            if (examType !== 'COMBINED') query.append('type', examType);
            console.log('Fetching exam reports with query:', query.toString());
            api.get(`/reports/exams?${query.toString()}`)
                .then(res => {
                    console.log('Exam reports received:', res);
                    setData(res.data || res);
                    setTotalCount(res.total || res.length);
                    setCurrentPage(page);
                })
                .catch(err => {
                    console.error('Exam reports failed:', err);
                })
                .finally(() => setLoading(false));
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toggleStudent = (id) => {
        setExpandedStudent(expandedStudent === id ? null : id);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const getMarksClass = (score, total) => {
        if (!total) return '';
        const pct = (score / total) * 100;
        if (pct >= 80) return 'marks-high';
        if (pct >= 40) return 'marks-mid';
        return 'marks-low';
    };

    return (
        <div class="reports-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Reports</div>
                    <h1>{view === 'students' ? 'Student Reports' : 'Exam Reports'}</h1>
                    <p class="page-subtitle">
                        {view === 'students'
                            ? 'Per-student performance across all exams.'
                            : 'Detailed results by exam and student.'}
                    </p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{totalCount.toLocaleString()}</span>
                            <span class="hm-label">Records</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <div class="segmented">
                        <button class={view === 'exams' ? 'active' : ''} onClick={() => { setView('exams'); setExamType('COMBINED'); }}>Exam Reports</button>
                        <button class={view === 'students' ? 'active' : ''} onClick={() => setView('students')}>Student Reports</button>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: var(--space-lg); padding: var(--space-lg);">
                <div class="reports-filters" style="margin:0;">
                    <div class="filter-group">
                        <label>Board</label>
                        <select class="form-control" value={filters.board} onChange={(e) => handleFilterChange('board', e.target.value)}>
                            <option value="">All Boards</option>
                            {BOARDS.map(b => <option value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Standard</label>
                        <select class="form-control" value={filters.std} onChange={(e) => handleFilterChange('std', e.target.value)}>
                            <option value="">All Standards</option>
                            {standards.map(s => <option value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Medium</label>
                        <select class="form-control" value={filters.medium} onChange={(e) => handleFilterChange('medium', e.target.value)}>
                            <option value="">All Mediums</option>
                            {MEDIUMS.map(m => <option value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Stream</label>
                        <select class="form-control" value={filters.stream} onChange={(e) => handleFilterChange('stream', e.target.value)}>
                            <option value="">All Streams</option>
                            {STREAMS.map(s => <option value={s}>{s}</option>)}
                        </select>
                    </div>
                    {view === 'exams' && (
                        <div class="filter-group">
                            <label>Exam Type</label>
                            <select class="form-control" value={examType} onChange={(e) => setExamType(e.target.value)}>
                                {EXAM_TYPES.map(t => <option value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                    )}
                    <button class="btn btn-outline" style="margin-bottom: 0;" onClick={() => {
                        setFilters({ board: '', std: '', medium: '', stream: '' });
                        setExamType('COMBINED');
                    }}>
                        <Icons.Refresh /> Reset
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
                            <h3 style="font-size:var(--font-md);font-weight:600;">
                                {view === 'students' ? 'Student-wise Results' : `${EXAM_TYPES.find(t => t.id === examType)?.label} Results`}
                            </h3>
                        </div>
                        <div class="toolbar-group">
                            <select
                                class="form-control"
                                value={pageSize}
                                onChange={(e) => {
                                    const newPageSize = parseInt(e.target.value);
                                    setPageSize(newPageSize);
                                    setCurrentPage(1);
                                    const query = new URLSearchParams();
                                    if (filters.board) query.append('board', filters.board);
                                    if (filters.std) query.append('std', filters.std);
                                    if (filters.medium) query.append('medium', filters.medium);
                                    if (filters.stream) query.append('stream', filters.stream);
                                    query.append('skip', 0);
                                    query.append('limit', newPageSize);

                                    setLoading(true);
                                    if (view === 'students') {
                                        api.get(`/reports/students?${query.toString()}`)
                                            .then(res => {
                                                setData(res.data || res);
                                                setTotalCount(res.total || res.length);
                                            })
                                            .finally(() => setLoading(false));
                                    } else {
                                        if (examType !== 'COMBINED') query.append('type', examType);
                                        api.get(`/reports/exams?${query.toString()}`)
                                            .then(res => {
                                                setData(res.data || res);
                                                setTotalCount(res.total || res.length);
                                            })
                                            .finally(() => setLoading(false));
                                    }
                                }}
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div class="loading-spinner" />
                ) : data.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Reports /></div>
                        <h3>No reports found</h3>
                        <p>No records match your current filters. Try broadening them.</p>
                    </div>
                ) : view === 'students' ? (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th width="40"></th>
                                    <th>Student Name</th>
                                    <th>Phone</th>
                                    <th>Standard</th>
                                    <th>Total Exams</th>
                                    <th>Avg. Marks</th>
                                    <th>Medium</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(student => (
                                    <Fragment key={student._id}>
                                        <tr class="student-row-header" onClick={() => toggleStudent(student._id)}>
                                            <td>
                                                <span class={`expander-icon ${expandedStudent === student._id ? 'open' : ''}`}>
                                                    <Icons.ChevronRight />
                                                </span>
                                            </td>
                                            <td style="font-weight: 600;">{student.name}</td>
                                            <td>{student.phone}</td>
                                            <td>{student.std} {student.stream !== 'None' ? `(${student.stream})` : ''}</td>
                                            <td>{student.totalExams}</td>
                                            <td>
                                                <span class={`marks-badge ${student.avgMarks >= 70 ? 'marks-high' : 'marks-mid'}`}>
                                                    {student.avgMarks.toFixed(1)}
                                                </span>
                                            </td>
                                            <td>{student.medium}</td>
                                        </tr>
                                        {expandedStudent === student._id && (
                                            <tr class="student-details-row">
                                                <td colspan="7">
                                                    <table class="nested-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Exam Title</th>
                                                                <th>Type</th>
                                                                <th>Score</th>
                                                                <th>Total</th>
                                                                <th>Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {student.exams.map((ex, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{ex.title}</td>
                                                                    <td><span class="badge badge-outline">{ex.type}</span></td>
                                                                    <td>
                                                                        <span class={`marks-badge ${getMarksClass(ex.score, ex.total)}`}>
                                                                            {ex.score}
                                                                        </span>
                                                                    </td>
                                                                    <td>{ex.total}</td>
                                                                    <td>{new Date(ex.date).toLocaleDateString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: '1rem'; border-top: 1px solid var(--border); margin-top: 1.5rem; gap: 1rem;">
                            <span style="font-size: var(--font-sm); color: var(--text-secondary);">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => loadData(currentPage - 1)}
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
                                                    onClick={() => loadData(pageNum)}
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
                                    onClick={() => loadData(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Student Name</th>
                                    <th>Standard</th>
                                    <th>Type</th>
                                    <th>Obtained</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item._id}>
                                        <td style="font-weight: 600;">{item.title}</td>
                                        <td>{item.studentName}</td>
                                        <td>{item.std} {item.stream !== 'None' ? `(${item.stream})` : ''}</td>
                                        <td><span class="badge badge-outline">{item.type}</span></td>
                                        <td>
                                            <span class={`marks-badge ${getMarksClass(item.obtainedMarks, item.totalMarks)}`}>
                                                {item.obtainedMarks}
                                            </span>
                                        </td>
                                        <td>{item.totalMarks}</td>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: '1rem'; border-top: 1px solid var(--border); margin-top: 1.5rem; gap: 1rem;">
                            <span style="font-size: var(--font-sm); color: var(--text-secondary);">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => loadData(currentPage - 1)}
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
                                                    onClick={() => loadData(pageNum)}
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
                                    onClick={() => loadData(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
