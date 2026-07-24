import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { getFileUrl } from '../fileUrl';

const GAME_TYPES = [
    'Speed Math',
    'Word Scramble',
    'Odd One Out',
    'Fact or Fiction',
    'Sentence Builder',
    'Grammar Guardian',
    'Word Bridge',
    'Emoji Decoder',
    'Math Riddles',
    'Number Series',
    'Algebra Balancer',
    'Flag Explorer',
    'Spelling Master',
    'Synonym & Antonym',
    'Language Translator',
    'Subject Word Search',
    'Grammar Sorter',
    'Capital City Quest',
    'Proverb Completer',
    'Direction Sense',
    'GK Quiz',
    'Syllable Scramble',
    'Word Chain'
];

export function MindGames() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);

    // Filter/Sort State
    const [selectedFilterGameType, setSelectedFilterGameType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDirection, setSortDirection] = useState('asc'); // asc or desc
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Form State
    const [gameType, setGameType] = useState('Speed Math');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionText, setQuestionText] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    
    // Meta Fields
    const [hint, setHint] = useState('');
    const [fact, setFact] = useState('');
    const [reason, setReason] = useState('');
    const [wordsList, setWordsList] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setGameType('Speed Math');
        setDifficulty('Medium');
        setQuestionText('');
        setCorrectAnswer('');
        setOptions(['', '', '', '']);
        setHint('');
        setFact('');
        setReason('');
        setWordsList('');
        setEditingQuestion(null);
    };

    const loadQuestions = () => {
        setLoading(true);
        api.get('/games', { noPrefix: true })
            .then(response => {
                setQuestions(response.questions || response || []);
            })
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const handleGameTypeChange = (newType) => {
        setGameType(newType);
        // Clear inputs when game type changes to keep validations clean
        setQuestionText('');
        setCorrectAnswer('');
        setOptions(['', '', '', '']);
        setHint('');
        setFact('');
        setReason('');
        setWordsList('');
    };

    const handleEdit = (q) => {
        setEditingQuestion(q._id);
        setGameType(q.gameType);
        setDifficulty(q.difficulty || 'Medium');
        setQuestionText(q.questionText || '');
        setCorrectAnswer(q.correctAnswer || '');
        
        const rawOpts = q.options || [];
        const mappedOpts = [...rawOpts];
        while (mappedOpts.length < 4) mappedOpts.push('');
        setOptions(mappedOpts.slice(0, 4));

        if (q.meta) {
            setHint(q.meta.hint || '');
            setFact(q.meta.fact || '');
            setReason(q.meta.reason || '');
            setWordsList(q.meta.wordsList || '');
        } else {
            setHint('');
            setFact('');
            setReason('');
            setWordsList('');
        }
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!gameType) return showToast("Game Type is required.", "error");
        if (!questionText && gameType !== 'Odd One Out' && gameType !== 'Word Scramble') {
            return showToast("Question / Challenge text is required.", "error");
        }
        if (!correctAnswer) return showToast("Correct Answer is required.", "error");

        // Game specific validation
        if ([
            'Speed Math', 'Grammar Guardian', 'Word Bridge', 'GK Quiz', 
            'Flag Explorer', 'Proverb Completer', 'Language Translator', 'Odd One Out'
        ].includes(gameType)) {
            if (!options[0] || !options[1]) {
                return showToast("Please fill in at least the first two options.", "error");
            }
        }

        if (gameType === 'Fact or Fiction' && !fact) {
            return showToast("Explanation Fact is required for Fact or Fiction.", "error");
        }

        if (gameType === 'Odd One Out' && !reason) {
            return showToast("Reason is required for Odd One Out.", "error");
        }

        try {
            // Build Meta
            const meta = {};
            if ([
                'Math Riddles', 'Number Series', 'Magic Square', 'Algebra Balancer', 
                'Syllable Scramble', 'Proverb Completer', 'Direction Sense', 
                'Word Chain', 'Emoji Decoder', 'Language Translator'
            ].includes(gameType)) {
                if (hint) meta.hint = hint;
            }
            if (gameType === 'Fact or Fiction') {
                meta.fact = fact;
            }
            if (['Odd One Out', 'Direction Sense'].includes(gameType)) {
                meta.reason = reason;
            }
            if (['Subject Word Search', 'Grammar Sorter', 'Word Chain'].includes(gameType)) {
                meta.wordsList = wordsList;
            }

            const payload = {
                gameType,
                difficulty,
                questionText,
                correctAnswer,
                options: options.filter(o => o.trim() !== ''),
                meta
            };

            if (editingQuestion) {
                await api.put(`/games/edit/${editingQuestion}`, payload, { noPrefix: true });
                showToast("Question updated successfully!");
            } else {
                await api.post('/games/add', payload, { noPrefix: true });
                showToast("Question created successfully!");
            }

            setShowAddModal(false);
            resetForm();
            loadQuestions();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/games/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadQuestions();
            showToast("Question deleted successfully!");
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Filter and Sort Logic
    const filteredQuestions = questions.filter(q => {
        const matchesGameType = !selectedFilterGameType || q.gameType === selectedFilterGameType;
        const matchesSearch = !searchTerm || 
            (q.questionText && q.questionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (q.correctAnswer && q.correctAnswer.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesGameType && matchesSearch;
    });

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        const gameA = a.gameType || '';
        const gameB = b.gameType || '';
        return sortDirection === 'asc' ? gameA.localeCompare(gameB) : gameB.localeCompare(gameA);
    });

    // Pagination
    const totalCount = sortedQuestions.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedQuestions = sortedQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Helpers to render dynamic inputs
    const renderGameSpecificFields = () => {
        switch (gameType) {
            case 'Speed Math':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Math Question * (e.g. 5 + 3 = ?)</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. 5 + 3 = ?" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Answer *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. 8" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options * (Fill in 4 choices, including correct answer)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'Emoji Decoder':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Emojis * (e.g. 🤐 🥈 🥇)</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. 🤐 🥈 🥇" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Phrase (Answer) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. Silence is golden" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Hint (Optional)</label>
                            <input type="text" class="form-control" value={hint} onInput={(e) => setHint(e.target.value)} placeholder="A common proverb" />
                        </div>
                    </div>
                );

            case 'Fact or Fiction':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Statement *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. Bananas grow on trees." />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Answer *</label>
                            <select class="form-control" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                                <option value="">Select Truth Value</option>
                                <option value="Fact">Fact</option>
                                <option value="Fiction">Fiction</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Explanation / Fact *</label>
                            <textarea class="form-control" value={fact} onInput={(e) => setFact(e.target.value)} placeholder="e.g. Banana plants are actually large herbaceous plants, not trees." />
                        </div>
                    </div>
                );

            case 'Odd One Out':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Odd One Out (Answer) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. Apple" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Reason (Why is it odd?) *</label>
                            <input type="text" class="form-control" value={reason} onInput={(e) => setReason(e.target.value)} placeholder="e.g. It is a fruit, others are vegetables" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options * (Include the odd one and 3 others)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'Word Scramble':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Word (Answer) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => {
                                setCorrectAnswer(e.target.value);
                                if (!questionText) setQuestionText(e.target.value);
                            }} placeholder="e.g. COMPUTER" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Scrambled Word (Optional - leave same as Answer to auto-scramble)</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. PMOCTUER" />
                        </div>
                    </div>
                );

            case 'Sentence Builder':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Sentence *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => {
                                setQuestionText(e.target.value);
                                setCorrectAnswer(e.target.value);
                            }} placeholder="e.g. The quick brown fox jumps over the lazy dog." />
                        </div>
                        <p style="font-size:0.85rem; color:var(--text-secondary); margin:0;">Note: The words in the sentence will be shuffled automatically for students.</p>
                    </div>
                );

            case 'Language Translator':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Word in Source Language *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. Hello" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Word in Target Language (Answer) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. Hola" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Target Language Name *</label>
                            <input type="text" class="form-control" value={hint} onInput={(e) => setHint(e.target.value)} placeholder="e.g. Spanish" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options * (Include target word and 3 other translations)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'Synonym & Antonym':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">First Word *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. Big" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Second Word *</label>
                            <input type="text" class="form-control" value={options[0]} onInput={(e) => {
                                const updated = [...options];
                                updated[0] = e.target.value;
                                setOptions(updated);
                            }} placeholder="e.g. Large" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Relationship (Answer) *</label>
                            <select class="form-control" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                                <option value="">Select Relation</option>
                                <option value="Synonym">Synonym</option>
                                <option value="Antonym">Antonym</option>
                            </select>
                        </div>
                    </div>
                );

            case 'Subject Word Search':
            case 'Grammar Sorter':
            case 'Word Chain':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Title / Instruction *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. Find grammatical terms" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Words List * (Comma separated)</label>
                            <textarea class="form-control" value={wordsList} onInput={(e) => {
                                setWordsList(e.target.value);
                                setCorrectAnswer(e.target.value);
                            }} placeholder="e.g. NOUN, VERB, ADVERB, PRONOUN" />
                        </div>
                    </div>
                );

            case 'Direction Sense':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Movement Scenario *</label>
                            <textarea class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. A man walks 5km North, then turns right and walks 3km..." />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Question Text *</label>
                            <input type="text" class="form-control" value={reason} onInput={(e) => setReason(e.target.value)} placeholder="In which direction is he facing now?" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Answer (Direction) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. East" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options (Optional - North, South, East, West used by default)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'Proverb Completer':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Proverb with [BLANK] *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="e.g. A blessing in [BLANK]." />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Missing Word (Answer) *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="e.g. disguise" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Hint (Optional)</label>
                            <input type="text" class="form-control" value={hint} onInput={(e) => setHint(e.target.value)} placeholder="Something hidden" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options (Optional - if left blank, random proverbs will be used)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            // Default Short Answer & Math Riddles etc.
            case 'Math Riddles':
            case 'Number Series':
            case 'Spelling Master':
            case 'Magic Square':
            case 'Algebra Balancer':
            case 'Syllable Scramble':
            case 'Logic Gates Quest':
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Question / Challenge Text *</label>
                            <textarea class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="Enter the challenge details..." />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Answer *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="Correct answer" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Hint (Optional)</label>
                            <input type="text" class="form-control" value={hint} onInput={(e) => setHint(e.target.value)} placeholder="Optional hint" />
                        </div>
                    </div>
                );

            // Default standard MCQ games
            default:
                return (
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="font-weight:600;">Question Text *</label>
                            <input type="text" class="form-control" value={questionText} onInput={(e) => setQuestionText(e.target.value)} placeholder="Enter question..." />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Correct Answer *</label>
                            <input type="text" class="form-control" value={correctAnswer} onInput={(e) => setCorrectAnswer(e.target.value)} placeholder="Correct answer" />
                        </div>
                        <div class="form-group">
                            <label style="font-weight:600;">Options * (Fill in 4 choices, including correct answer)</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
                                {options.map((opt, i) => (
                                    <input key={i} type="text" class="form-control" value={opt} onInput={(e) => {
                                        const updated = [...options];
                                        updated[i] = e.target.value;
                                        setOptions(updated);
                                    }} placeholder={`Option ${i + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div class="materials-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Sparkles /> Brain Games</div>
                    <h1>Mind Games</h1>
                    <p class="page-subtitle">Manage cognitive, mathematical, and linguistic puzzles for kids.</p>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={loadQuestions}>
                        <Icons.Refresh /> Refresh
                    </button>
                    <button class="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Icons.Plus /> Add Question
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                        <div class="toolbar-group" style="display:flex; gap:1rem; align-items:center;">
                            <input
                                type="text"
                                class="form-control search-input"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onInput={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                class="form-control"
                                value={selectedFilterGameType}
                                onChange={(e) => setSelectedFilterGameType(e.target.value)}
                            >
                                <option value="">All Games</option>
                                {GAME_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-outline btn-sm" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
                                Sort: Game Name {sortDirection === 'asc' ? '▲' : '▼'}
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div class="loading-spinner" />
                ) : paginatedQuestions.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Sparkles /></div>
                        <h3>No questions found</h3>
                        <p>Create your first mind game question to get started.</p>
                    </div>
                ) : (
                    <>
                        <div class="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Game Type</th>
                                        <th>Question / Challenge</th>
                                        <th>Difficulty</th>
                                        <th>Correct Answer</th>
                                        <th style="text-align:right;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuestions.map(item => (
                                        <tr key={item._id}>
                                            <td>
                                                <div class="identity">
                                                    <div class="avatar avatar-sm" style={{ background: 'var(--accent)' }}><Icons.Sparkles /></div>
                                                    <div class="identity-body">
                                                        <div class="identity-name">{item.gameType}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                                {item.questionText || '—'}
                                            </td>
                                            <td><span class={`cell-chip ${item.difficulty?.toLowerCase()}`}>{item.difficulty}</span></td>
                                            <td>{item.correctAnswer}</td>
                                            <td>
                                                <div class="td-actions" style="justify-content:flex-end;">
                                                    <button class="icon-btn primary" onClick={() => handleEdit(item)} title="Edit">
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
                        {totalPages > 1 && (
                            <div class="pagination">
                                <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}</span>
                                <div class="pagination-controls">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><Icons.ChevronLeft /></button>
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button key={pageNum} class={pageNum === currentPage ? 'active' : ''} onClick={() => setCurrentPage(pageNum)}>
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><Icons.ChevronRight /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showAddModal && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>{editingQuestion ? 'Edit Game Question' : 'Add New Game Question'}</h3>
                            <button class="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>&times;</button>
                        </div>
                        <div class="modal-body" style="display:flex; flex-direction:column; gap:1.5rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                                <div class="form-group">
                                    <label style="font-weight:600; display:block; margin-bottom:0.5rem;">Game Type *</label>
                                    <select class="form-control" value={gameType} onChange={(e) => handleGameTypeChange(e.target.value)} disabled={!!editingQuestion}>
                                        {GAME_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="font-weight:600; display:block; margin-bottom:0.5rem;">Difficulty *</label>
                                    <select class="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div style="background:var(--bg-secondary); padding:1rem; border-radius:8px; border:1px solid var(--border-color); font-size:0.9rem;">
                                <strong>Instructions / Samples:</strong>
                                {gameType === 'Speed Math' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students solve arithmetic equations. Write the equation in the question, the numerical result in correct answer, and list 4 choices.</p>}
                                {gameType === 'Emoji Decoder' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students translate emojis into phrases/words. Enter emojis in the question, the phrase in correct answer, and an optional hint.</p>}
                                {gameType === 'Fact or Fiction' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students decide if a statement is fact or fiction. Write a statement in question, select Fact/Fiction as answer, and provide the explanation fact.</p>}
                                {gameType === 'Odd One Out' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students spot the word that does not fit. Provide correct answer (odd one), reason (why), and 4 choices.</p>}
                                {gameType === 'Word Scramble' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students unscramble letters. Write the correct word in answer, and optionally a custom scrambled version in question.</p>}
                                {gameType === 'Sentence Builder' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Students arrange words to form a correct sentence. Write the correct sentence in question. Shuffling is automated.</p>}
                                {['Math Riddles', 'Number Series', 'Magic Square', 'Algebra Balancer', 'Syllable Scramble', 'Logic Gates Quest'].includes(gameType) && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Short Answer Game. Write the riddle/series/description, correct answer, and an optional hint.</p>}
                                {gameType === 'Direction Sense' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Logical direction puzzle. Write scenario description, question text, correct direction, and optional choices.</p>}
                                {gameType === 'Proverb Completer' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Fill in missing proverb word. Write proverb with [BLANK], the missing word in answer, and optional choices.</p>}
                                {gameType === 'Language Translator' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Translation game. Word in source language, correct translation in target, target language name in hint, and 4 choices.</p>}
                                {gameType === 'Synonym & Antonym' && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Word pairs comparison. Write first word, second word, and specify the relationship (Synonym / Antonym).</p>}
                                {['Subject Word Search', 'Grammar Sorter', 'Word Chain'].includes(gameType) && <p style="margin:4px 0 0 0; color:var(--text-secondary);">Write instructions/theme in title, and enter a comma-separated list of words (e.g. OXYGEN, HYDROGEN) in Words List.</p>}
                            </div>

                            {renderGameSpecificFields()}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave}>
                                {editingQuestion ? 'Update Question' : 'Save Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Question</h3>
                            <button class="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this game question?</p>
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
