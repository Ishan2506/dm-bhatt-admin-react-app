import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    pointsPerReferral: [50, 50, 50, 50, 50],
    maxReferralsAllowed: 5,
    pointsPerRupee: 10,
    maxPointsDiscountPercent: 50,
};

export function ReferAndEarnConfig() {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/config/referral')
            .then(res => {
                if (res) {
                    const maxAllowed = res.maxReferralsAllowed !== undefined ? Number(res.maxReferralsAllowed) : 5;
                    let points = res.pointsPerReferral;
                    if (!Array.isArray(points)) {
                        const baseVal = points !== undefined ? Number(points) : 50;
                        points = Array(maxAllowed).fill(baseVal);
                    }
                    // Resize to match maxAllowed if mismatch
                    if (points.length !== maxAllowed) {
                        if (points.length < maxAllowed) {
                            points = [...points, ...Array(maxAllowed - points.length).fill(points[points.length - 1] || 50)];
                        } else {
                            points = points.slice(0, maxAllowed);
                        }
                    }
                    setForm({
                        maxReferralsAllowed: maxAllowed,
                        pointsPerReferral: points,
                        pointsPerRupee: res.pointsPerRupee !== undefined ? Number(res.pointsPerRupee) : 10,
                        maxPointsDiscountPercent: res.maxPointsDiscountPercent !== undefined ? Number(res.maxPointsDiscountPercent) : 50
                    });
                }
            })
            .catch(() => {}) // Silently fail if config not yet saved
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Input Validations
        if (form.maxReferralsAllowed === "" || isNaN(form.maxReferralsAllowed)) {
            alert('Please enter a valid number for maximum referrals');
            return;
        }
        if (form.maxReferralsAllowed > 5) {
            alert('Maximum referrals allowed cannot be greater than 5');
            return;
        }
        if (form.maxReferralsAllowed < 1) {
            alert('Maximum referrals allowed must be at least 1');
            return;
        }
        
        // Validate each stage points
        for (let i = 0; i < form.pointsPerReferral.length; i++) {
            const ptsVal = form.pointsPerReferral[i];
            if (ptsVal === "" || ptsVal < 0 || isNaN(ptsVal)) {
                alert(`Stage ${i + 1} Points cannot be less than 0 or empty`);
                return;
            }
        }

        // Validate points-to-rupee conversion rate
        if (form.pointsPerRupee === "" || isNaN(form.pointsPerRupee) || Number(form.pointsPerRupee) <= 0) {
            alert('Points per ₹1 must be a number greater than 0');
            return;
        }

        // Validate max discount cap
        const cap = Number(form.maxPointsDiscountPercent);
        if (form.maxPointsDiscountPercent === "" || isNaN(cap) || cap < 0 || cap > 100) {
            alert('Max points discount must be between 0 and 100 percent');
            return;
        }

        setSaving(true);
        setSaved(false);
        try {
            await api.post('/config/referral', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save referral configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleMaxReferralsChange = (e) => {
        const rawValue = e.target.value;
        if (rawValue === "") {
            setForm({
                ...form,
                maxReferralsAllowed: "",
            });
            return;
        }

        const val = Number(rawValue);
        // Clamp length to 1-5 for safety of the array list sizing
        const arraySize = Math.min(5, Math.max(1, val));
        
        let newPoints = [...form.pointsPerReferral];
        if (newPoints.length < arraySize) {
            newPoints = [...newPoints, ...Array(arraySize - newPoints.length).fill(newPoints[newPoints.length - 1] || 50)];
        } else if (newPoints.length > arraySize) {
            newPoints = newPoints.slice(0, arraySize);
        }
        
        setForm({
            ...form,
            maxReferralsAllowed: val,
            pointsPerReferral: newPoints
        });
    };

    const handleStagePointChange = (idx, value) => {
        if (value === "") {
            const newPoints = [...form.pointsPerReferral];
            newPoints[idx] = "";
            setForm({
                ...form,
                pointsPerReferral: newPoints
            });
            return;
        }
        const newPoints = [...form.pointsPerReferral];
        newPoints[idx] = Number(value);
        setForm({
            ...form,
            pointsPerReferral: newPoints
        });
    };

    if (loading) return <div style="padding:2rem;text-align:center;">Loading configuration...</div>;

    return (
        <div>
            <div class="config-page">
                <div class="page-header">
                    <div class="page-header-titles">
                        <div class="page-header-eyebrow"><Icons.User /> Configuration</div>
                        <h1>Refer & Earn</h1>
                        <p class="page-subtitle">Manage dynamic limits and rewards for the referral program.</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Sparkles /></div>
                            <div>
                                <h3 class="config-section-title">Referral Program Rules</h3>
                                <p class="config-section-desc">Set limits on how many people a user can refer and how many points they get at each stage.</p>
                            </div>
                        </div>
                        <div class="config-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div class="form-group">
                                <label>Max Referrals Allowed per User</label>
                                <input 
                                    class="form-control" 
                                    type="number" 
                                    placeholder="e.g. 5" 
                                    min="1" 
                                    max="5" 
                                    value={form.maxReferralsAllowed}
                                    onInput={handleMaxReferralsChange} 
                                />
                            </div>
                            <div class="stage-points-container" style="display: flex; flex-direction: column; gap: 1rem;">
                                <label style="font-weight: bold; margin-bottom: 0.5rem;">Milestone Points Per Stage</label>
                                {form.pointsPerReferral.map((pts, idx) => (
                                    <div key={idx} class="form-group" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
                                        <span style="font-size: 0.9rem; color: var(--color-text-muted); min-width: 120px;">
                                            Referral #{idx + 1} Points:
                                        </span>
                                        <input 
                                            class="form-control" 
                                            type="number" 
                                            min="0"
                                            value={pts} 
                                            onInput={(e) => handleStagePointChange(idx, e.target.value)} 
                                            style="flex: 1;"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Sparkles /></div>
                            <div>
                                <h3 class="config-section-title">Points Value</h3>
                                <p class="config-section-desc">Set how many points equal ₹1, and how much of a product's price points are allowed to cover at checkout.</p>
                            </div>
                        </div>
                        <div class="config-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div class="form-group">
                                <label>Points per ₹1</label>
                                <input
                                    class="form-control"
                                    type="number"
                                    placeholder="e.g. 10"
                                    min="1"
                                    step="1"
                                    value={form.pointsPerRupee}
                                    onInput={(e) => setForm({
                                        ...form,
                                        pointsPerRupee: e.target.value === "" ? "" : Number(e.target.value)
                                    })}
                                />
                            </div>
                            <div class="form-group">
                                <label>Max Points Discount (% of price)</label>
                                <input
                                    class="form-control"
                                    type="number"
                                    placeholder="e.g. 50"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={form.maxPointsDiscountPercent}
                                    onInput={(e) => setForm({
                                        ...form,
                                        maxPointsDiscountPercent: e.target.value === "" ? "" : Number(e.target.value)
                                    })}
                                />
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; border-radius: 8px; background: var(--color-surface-muted, rgba(0,0,0,0.03));">
                            <span style="font-size: 0.9rem; color: var(--color-text-muted);">
                                {form.pointsPerRupee > 0
                                    ? `₹1 = ${form.pointsPerRupee} points. On a ₹500 material, a student can pay at most ₹${Math.floor((500 * (Number(form.maxPointsDiscountPercent) || 0)) / 100)} with points (${Math.ceil(Math.floor((500 * (Number(form.maxPointsDiscountPercent) || 0)) / 100) * form.pointsPerRupee)} points) and pays the rest by card/UPI.`
                                    : 'Enter a rate greater than 0'}
                            </span>
                        </div>
                    </div>

                    <div class="sticky-actions">
                        {saved && (
                            <span class="save-success"><Icons.Success /> Saved successfully</span>
                        )}
                        <button class="btn btn-primary btn-lg" type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
