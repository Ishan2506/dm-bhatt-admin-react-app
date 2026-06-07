import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Icons } from './Icons';

export function AdvancedDateTimePicker({ value, onChange, label }) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [date, setDate] = useState('');
    const [hours, setHours] = useState('00');
    const [minutes, setMinutes] = useState('00');
    const [period, setPeriod] = useState('AM');
    const hoursRef = useRef(null);
    const minutesRef = useRef(null);

    useEffect(() => {
        if (value) {
            const parts = value.split('T');
            setDate(parts[0] || new Date().toISOString().split('T')[0]);
            const timePart = parts[1] || '00:00';
            const [h, m] = timePart.split(':');
            const hour24 = parseInt(h);
            const period = hour24 >= 12 ? 'PM' : 'AM';
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            setHours(String(hour12).padStart(2, '0'));
            setMinutes(m);
            setPeriod(period);
        } else {
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
        }
    }, [value]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        updateValue(newDate, hours, minutes, period);
        setShowDatePicker(false);
    };

    const handleTimeChange = (newHours, newMinutes, newPeriod) => {
        setHours(newHours);
        setMinutes(newMinutes);
        setPeriod(newPeriod);
        updateValue(date, newHours, newMinutes, newPeriod);
    };

    const updateValue = (d, h, m, p) => {
        if (!d) return;
        let hour24 = parseInt(h);
        if (p === 'PM' && hour24 !== 12) hour24 += 12;
        if (p === 'AM' && hour24 === 12) hour24 = 0;
        const timeStr = `${String(hour24).padStart(2, '0')}:${m}`;
        onChange(`${d}T${timeStr}`);
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

    const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            {/* Date Picker */}
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

                    {showDatePicker && calendar && (
                        <div
                            style="position: absolute; top: calc(100% + 0.5rem); left: 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; z-index: 1000; min-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);"
                        >
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem;">
                                <button
                                    type="button"
                                    style="background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 6px; font-weight: 600;"
                                    onClick={() => {
                                        const d = new Date(date + 'T00:00');
                                        d.setMonth(d.getMonth() - 1);
                                        const newDate = d.toISOString().split('T')[0];
                                        setDate(newDate);
                                    }}
                                >
                                    ← Prev
                                </button>
                                <span style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); min-width: 160px; text-align: center;">
                                    {new Date(calendar.year, calendar.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    type="button"
                                    style="background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 6px; font-weight: 600;"
                                    onClick={() => {
                                        const d = new Date(date + 'T00:00');
                                        d.setMonth(d.getMonth() + 1);
                                        const newDate = d.toISOString().split('T')[0];
                                        setDate(newDate);
                                    }}
                                >
                                    Next →
                                </button>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem;">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} style="text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); padding: 0.5rem 0;">
                                        {day}
                                    </div>
                                ))}
                                {calendar.days.map((day, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        style={`padding: 0.75rem 0; border: none; border-radius: 6px; cursor: ${day ? 'pointer' : 'default'}; font-weight: 600; font-size: 0.95rem; ${
                                            day
                                                ? `background: ${date.endsWith(String(day).padStart(2, '0')) ? 'var(--primary)' : 'transparent'}; color: ${date.endsWith(String(day).padStart(2, '0')) ? '#fff' : 'var(--text-primary)'}; hover:background: var(--bg-input);`
                                                : 'visibility: hidden;'
                                        }`}
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

                            <button
                                type="button"
                                style="width: 100%; margin-top: 1.5rem; padding: 0.75rem; background: var(--primary); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
                                onClick={() => setShowDatePicker(false)}
                            >
                                Confirm
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Picker */}
            <div class="form-group">
                <label>{label?.split('&')[1]?.trim() || 'Time'}</label>
                <div style="position: relative;">
                    <button
                        type="button"
                        class="form-control"
                        style="text-align: center; background: var(--bg-input); border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; font-weight: 600; font-size: 1rem;"
                        onClick={() => setShowTimePicker(!showTimePicker)}
                    >
                        {hours}:{minutes} {period}
                    </button>

                    {showTimePicker && (
                        <div
                            style="position: absolute; top: 100%; right: 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; z-index: 1000; min-width: 280px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                        >
                            <div style="display: grid; grid-template-columns: 1fr 1fr 0.8fr; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
                                {/* Hours */}
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Hours</label>
                                    <div
                                        ref={hoursRef}
                                        style="height: 150px; overflow-y: scroll; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-input); scroll-snap-type: y mandatory;"
                                    >
                                        {hourOptions.map(h => (
                                            <div
                                                key={h}
                                                style={`padding: 0.75rem; text-align: center; cursor: pointer; scroll-snap-align: center; background: ${hours === h ? 'var(--primary)' : 'transparent'}; color: ${hours === h ? '#fff' : 'var(--text-primary)'}; font-weight: ${hours === h ? '600' : '400'};`}
                                                onClick={() => handleTimeChange(h, minutes, period)}
                                            >
                                                {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Minutes */}
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Minutes</label>
                                    <div
                                        ref={minutesRef}
                                        style="height: 150px; overflow-y: scroll; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-input); scroll-snap-type: y mandatory;"
                                    >
                                        {minuteOptions.map(m => (
                                            <div
                                                key={m}
                                                style={`padding: 0.75rem; text-align: center; cursor: pointer; scroll-snap-align: center; background: ${minutes === m ? 'var(--primary)' : 'transparent'}; color: ${minutes === m ? '#fff' : 'var(--text-primary)'}; font-weight: ${minutes === m ? '600' : '400'};`}
                                                onClick={() => handleTimeChange(hours, m, period)}
                                            >
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AM/PM */}
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Period</label>
                                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                        <button
                                            type="button"
                                            style={`padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; background: ${period === 'AM' ? 'var(--primary)' : 'var(--bg-input)'}; color: ${period === 'AM' ? '#fff' : 'var(--text-primary)'}; font-weight: ${period === 'AM' ? '600' : '400'};`}
                                            onClick={() => handleTimeChange(hours, minutes, 'AM')}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            style={`padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; background: ${period === 'PM' ? 'var(--primary)' : 'var(--bg-input)'}; color: ${period === 'PM' ? '#fff' : 'var(--text-primary)'}; font-weight: ${period === 'PM' ? '600' : '400'};`}
                                            onClick={() => handleTimeChange(hours, minutes, 'PM')}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; gap: 0.5rem;">
                                <button
                                    type="button"
                                    class="btn btn-outline btn-sm"
                                    style="flex: 1;"
                                    onClick={() => setShowTimePicker(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
