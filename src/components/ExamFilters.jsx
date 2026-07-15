import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Icons } from './Icons';
import { AcademicConstants } from '../utils/constants';

/**
 * Shared search + standard/subject/medium filtering for the exam list pages.
 *
 * The exam APIs return every record as a plain array (they ignore skip/limit),
 * so the full list already lives in memory and filtering/paging is done here on
 * the client. Pass the loaded array in and render the returned slice.
 */
export function useExamFilters(exams, { defaultPageSize = 25 } = {}) {
    const [search, setSearch] = useState('');
    const [std, setStd] = useState('');
    const [subject, setSubject] = useState('');
    const [medium, setMedium] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const list = Array.isArray(exams) ? exams : [];

    // Options come from the loaded exams so only values that actually exist are offered.
    const uniqueSorted = (values) => [...new Set(values.filter(Boolean).map(String))].sort();
    const stdOptions = uniqueSorted(list.map(e => e.std))
        .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
    const subjectOptions = uniqueSorted(list.map(e => e.subject));
    const mediumOptions = uniqueSorted([...AcademicConstants.mediums, ...list.map(e => e.medium)]);

    const query = search.trim().toLowerCase();
    const filtered = list.filter(item => {
        if (std && String(item.std) !== std) return false;
        if (subject && item.subject !== subject) return false;
        if (medium && item.medium !== medium) return false;
        if (!query) return true;
        return [item.title, item.subject, item.board, item.unit, item.std, item.medium]
            .some(v => (v || '').toString().toLowerCase().includes(query));
    });

    const hasActiveFilters = Boolean(query || std || subject || medium);
    const filteredCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
    // Clamp so a shrinking result set can never strand the user on an empty page.
    const page = Math.min(currentPage, totalPages);
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

    const clear = () => {
        setSearch('');
        setStd('');
        setSubject('');
        setMedium('');
        setCurrentPage(1);
    };

    // Any filter change sends the user back to page 1.
    const onFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

    return {
        visible,
        filteredCount,
        totalCount: list.length,
        hasActiveFilters,
        clear,
        page,
        totalPages,
        pageSize,
        setPage: setCurrentPage,
        // Everything <ExamFilterBar> needs, so pages can just spread it.
        bar: {
            search,
            setSearch: onFilterChange(setSearch),
            std,
            setStd: onFilterChange(setStd),
            subject,
            setSubject: onFilterChange(setSubject),
            medium,
            setMedium: onFilterChange(setMedium),
            pageSize,
            setPageSize: onFilterChange(setPageSize),
            stdOptions,
            subjectOptions,
            mediumOptions,
            filteredCount,
            totalCount: list.length,
            hasActiveFilters,
            clear,
        },
    };
}

/** Toolbar rendered in the table header: search box, three filters, page size. */
export function ExamFilterBar({
    search, setSearch,
    std, setStd,
    subject, setSubject,
    medium, setMedium,
    pageSize, setPageSize,
    stdOptions, subjectOptions, mediumOptions,
    filteredCount, totalCount, hasActiveFilters, clear,
    searchPlaceholder = 'Search exam, subject, unit…',
    onRefresh,
}) {
    return (
        <div class="table-header">
            <div class="toolbar" style="width:100%;">
                <div class="toolbar-group">
                    <div class="field-search">
                        <Icons.Eye />
                        <input
                            class="form-control"
                            placeholder={searchPlaceholder}
                            value={search}
                            onInput={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select class="form-control" value={std} onChange={(e) => setStd(e.target.value)}>
                        <option value="">All Standards</option>
                        {stdOptions.map(s => <option value={s}>Std {s}</option>)}
                    </select>
                    <select class="form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
                        <option value="">All Subjects</option>
                        {subjectOptions.map(s => <option value={s}>{s}</option>)}
                    </select>
                    <select class="form-control" value={medium} onChange={(e) => setMedium(e.target.value)}>
                        <option value="">All Mediums</option>
                        {mediumOptions.map(m => <option value={m}>{m}</option>)}
                    </select>
                    {hasActiveFilters && (
                        <button class="btn btn-outline btn-sm" onClick={clear}>Clear</button>
                    )}
                </div>
                <div class="toolbar-group">
                    {hasActiveFilters && (
                        <span style="font-size:var(--font-xs);color:var(--text-secondary);white-space:nowrap;">
                            {filteredCount.toLocaleString()} of {totalCount.toLocaleString()}
                        </span>
                    )}
                    <select
                        class="form-control"
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value))}
                    >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                    </select>
                    {onRefresh && (
                        <button class="btn btn-outline" onClick={onRefresh}>
                            <Icons.Refresh /> Refresh
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Empty state shown when filters exclude every row. */
export function NoFilterMatches({ onClear }) {
    return (
        <div class="empty-state">
            <div class="empty-state-icon"><Icons.Reports /></div>
            <h3>No exams match your filters</h3>
            <p>Try a different search term, standard, subject, or medium.</p>
            <button class="btn btn-outline" onClick={onClear}>Clear filters</button>
        </div>
    );
}

/** Pager over the filtered set. */
export function ExamPagination({ page, totalPages, pageSize, filteredCount, setPage }) {
    if (totalPages <= 1) return null;
    return (
        <div class="pagination">
            <span>
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredCount)} of {filteredCount.toLocaleString()}
            </span>
            <div class="pagination-controls">
                <button onClick={() => setPage(page - 1)} disabled={page === 1}><Icons.ChevronLeft /></button>
                {Array.from({ length: totalPages }, (_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                        return (
                            <button key={pageNum} class={pageNum === page ? 'active' : ''} onClick={() => setPage(pageNum)}>
                                {pageNum}
                            </button>
                        );
                    }
                    if ((pageNum === 2 && page > 3) || (pageNum === totalPages - 1 && page < totalPages - 2)) {
                        return <span key={pageNum}>…</span>;
                    }
                    return null;
                })}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages}><Icons.ChevronRight /></button>
            </div>
        </div>
    );
}
