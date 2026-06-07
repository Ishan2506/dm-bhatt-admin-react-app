import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Icons } from './Icons';

export function DateTimePicker({ value, onChange, label }) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('00:00');
    const datePickerRef = useRef(null);
    const timePickerRef = useRef(null);

    useEffect(() => {
        if (value) {
            const parts = value.split('T');
            setDate(parts[0] || '');
            setTime(parts[1]?.substring(0, 5) || '00:00');
        }
    }, [value]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        const newValue = `${newDate}T${time}`;
        onChange(newValue);
        setShowDatePicker(false);
    };

    const handleTimeChange = (newTime) => {
        setTime(newTime);
        const currentDate = date || new Date().toISOString().split('T')[0];
        const newValue = `${currentDate}T${newTime}`;
        onChange(newValue);
        setShowTimePicker(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Select Date';
        const d = new Date(dateStr + 'T00:00');
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendar = () => {
        if (!date) return null;
        const [year, month] = date.split('-').map(Number);
        const daysInMonth = getDaysInMonth(year, month - 1);
        const firstDay = getFirstDayOfMonth(year, month - 1);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return { days, year, month };
    };

    const calendar = generateCalendar();

    return (
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>{label?.split('&')[0]?.trim() || 'Date'}</label>
                <div style="position: relative;">
                    <button
                        type="button"
                        class="form-control"
                        style="text-align: left; background: var(--bg-input); border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem;"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                        <span>{formatDate(date)}</span>
                        <Icons.Calendar />
                    </button>

                    {showDatePicker && (
                        <div
                            ref={datePickerRef}
                            style="position: absolute; top: 100%; left: 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; z-index: 1000; min-width: 280px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                        >
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline"
                                    onClick={() => {
                                        const d = new Date(date);
                                        d.setMonth(d.getMonth() - 1);
                                        const newDate = d.toISOString().split('T')[0];
                                        setDate(newDate);
                                    }}
                                >
                                    ←
                                </button>
                                <span style="font-weight: 600; font-size: 0.95rem;">
                                    {calendar ? new Date(calendar.year, calendar.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Select month'}
                                </span>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline"
                                    onClick={() => {
                                        const d = new Date(date);
                                        d.setMonth(d.getMonth() + 1);
                                        const newDate = d.toISOString().split('T')[0];
                                        setDate(newDate);
                                    }}
                                >
                                    →
                                </button>
                            </div>

                            {calendar && (
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                        <div key={day} style="text-align: center; font-weight: 600; font-size: 0.8rem; color: var(--text-secondary); padding: 0.25rem;">
                                            {day}
                                        </div>
                                    ))}
                                    {calendar.days.map((day, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            class={day ? 'btn btn-sm' : ''}
                                            style={`${day ? `background: ${date.endsWith(String(day).padStart(2, '0')) ? 'var(--primary)' : 'transparent'}; color: ${date.endsWith(String(day).padStart(2, '0')) ? '#fff' : 'var(--text-primary)'}; cursor: pointer; border: none; padding: 0.5rem; border-radius: 4px;` : 'visibility: hidden;'}`}
                                            onClick={() => {
                                                if (day) {
                                                    const newDate = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    handleDateChange(newDate);
                                                }
                                            }}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div class="form-group">
                <label>{label?.split('&')[1]?.trim() || 'Time'}</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input
                        type="number"
                        min="0"
                        max="23"
                        value={time.split(':')[0]}
                        onChange={(e) => {
                            const hours = String(Math.min(23, Math.max(0, parseInt(e.target.value) || 0))).padStart(2, '0');
                            const minutes = time.split(':')[1];
                            handleTimeChange(`${hours}:${minutes}`);
                        }}
                        class="form-control"
                        style="width: 60px; text-align: center;"
                        placeholder="HH"
                    />
                    <span style="display: flex; align-items: center; font-weight: 600; color: var(--text-secondary);">:</span>
                    <input
                        type="number"
                        min="0"
                        max="59"
                        value={time.split(':')[1]}
                        onChange={(e) => {
                            const hours = time.split(':')[0];
                            const minutes = String(Math.min(59, Math.max(0, parseInt(e.target.value) || 0))).padStart(2, '0');
                            handleTimeChange(`${hours}:${minutes}`);
                        }}
                        class="form-control"
                        style="width: 60px; text-align: center;"
                        placeholder="MM"
                    />
                    <span style="flex: 1; display: flex; align-items: center; padding: 0.75rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary);">
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
}
