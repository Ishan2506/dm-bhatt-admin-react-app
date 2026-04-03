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

export function ReportsPage({ type: initialType }) {
    const [view, setView] = useState(initialType?.includes('students') ? 'students' : 'exams');
    const [examType, setExamType] = useState(initialType || 'COMBINED');
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [expandedStudent, setExpandedStudent] = useState(null);

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
        if (initialType?.includes('students')) {
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
    }, [initialType]);

    useEffect(() => {
        loadData();
    }, [view, examType, filters]);

    const loadData = () => {
        setLoading(true);
        const query = new URLSearchParams();
        if (filters.board) query.append('board', filters.board);
        if (filters.std) query.append('std', filters.std);
        if (filters.medium) query.append('medium', filters.medium);
        if (filters.stream) query.append('stream', filters.stream);

        if (view === 'students') {
            console.log('Fetching student reports with query:', query.toString());
            api.get(`/reports/students?${query.toString()}`)
                .then(res => {
                    console.log('Student reports received:', res);
                    setData(res);
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
                    setData(res);
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

    const getMarksClass = (score, total) => {
        if (!total) return '';
        const pct = (score / total) * 100;
        if (pct >= 80) return 'marks-high';
        if (pct >= 40) return 'marks-mid';
        return 'marks-low';
    };

    return (
        <div class="reports-page">
            <div class="reports-tabs">
                <div 
                    class={`report-tab ${view === 'exams' ? 'active' : ''}`} 
                    onClick={() => { setView('exams'); setExamType('COMBINED'); }}
                >
                    Exam Reports
                </div>
                <div 
                    class={`report-tab ${view === 'students' ? 'active' : ''}`} 
                    onClick={() => setView('students')}
                >
                    Student Reports
                </div>
            </div>

            <div class="reports-filters">
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
                    Reset
                </button>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>
                        {view === 'students' ? <Icons.User /> : <Icons.Reports />}
                        {view === 'students' ? ' Student Wise Reports' : ` ${EXAM_TYPES.find(t => t.id === examType)?.label} Reports`}
                    </h3>
                    <span class="badge badge-primary">{data.length} Results</span>
                </div>

                {loading ? (
                    <div style="padding: 3rem; text-align: center;">
                        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                        <p>Fetching reports...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No reports found matching your filters.</p>
                    </div>
                ) : view === 'students' ? (
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
                ) : (
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
                )}
            </div>
        </div>
    );
}
