import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, DollarSign } from 'lucide-react';
import ServiceItem from './ServiceItem';
import { calculateServiceRevenue, getSocialChargesRate, calculateServiceFixedCosts } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SimulationView({ simulation, updateSimulation, simulations, currentSimId, onDuplicateToOtherSimulation }) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [serviceToDuplicate, setServiceToDuplicate] = useState(null);
    const [duplicateDestination, setDuplicateDestination] = useState('current'); // 'current' or 'other'
    const [selectedTargetSimId, setSelectedTargetSimId] = useState(null);

    // Generate year options (current year and next 4 years)
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

    const addService = () => {
        const newServices = [...simulation.services, {
            id: Date.now(),
            name: '',
            price: 0,
            quantity: 0,
            frequency: 'mois',
            params: {
                socialChargesRate: 25 // Par défaut 25%
            }
        }];
        updateSimulation({ services: newServices });
    };

    const removeService = (serviceId) => {
        const serviceExists = simulation.services.some(s => s.id === serviceId);
        if (!serviceExists) return;

        const newServices = simulation.services.filter(s => s.id !== serviceId);
        updateSimulation({ services: newServices });
    };

    const updateService = (serviceId, field, value) => {
        const newServices = simulation.services.map(s =>
            s.id === serviceId ? (typeof field === 'object' ? { ...s, ...field } : { ...s, [field]: value }) : s
        );
        updateSimulation({ services: newServices });
    };

    const handleDuplicateClick = (serviceId) => {
        const service = simulation.services.find(s => s.id === serviceId);
        if (!service) return;
        setServiceToDuplicate(service);
        setShowDuplicateModal(true);
        setDuplicateDestination('current');
        setSelectedTargetSimId(null);
    };

    const handleConfirmDuplicate = () => {
        if (!serviceToDuplicate) return;

        if (duplicateDestination === 'current') {
            const duplicatedService = {
                ...serviceToDuplicate,
                id: Date.now(),
                name: `${serviceToDuplicate.name} (copie)`
            };
            const newServices = [...simulation.services, duplicatedService];
            updateSimulation({ services: newServices });
        } else if (duplicateDestination === 'other' && selectedTargetSimId) {
            if (onDuplicateToOtherSimulation) {
                onDuplicateToOtherSimulation(serviceToDuplicate, selectedTargetSimId);
            }
        }

        setShowDuplicateModal(false);
        setServiceToDuplicate(null);
        setDuplicateDestination('current');
        setSelectedTargetSimId(null);
    };

    const handleCancelDuplicate = () => {
        setShowDuplicateModal(false);
        setServiceToDuplicate(null);
        setDuplicateDestination('current');
        setSelectedTargetSimId(null);
    };

    const otherSimulations = simulations ? simulations.filter(s => s.id !== currentSimId) : [];

    // Calculate snapshot results for selected year (month by month)
    const results = useMemo(() => {
        let totalRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;

        // Data for chart
        const monthlyData = [];

        for (let month = 0; month < 12; month++) {
            let monthRevenue = 0;
            let monthCharges = 0;
            let monthFixed = 0;
            let monthOneShot = 0;

            simulation.services.forEach(s => {
                // Revenue for this month
                const r = calculateServiceRevenue(s, selectedYear, month);
                monthRevenue += r;

                // Charges for this month
                const monthDate = new Date(selectedYear, month, 1);
                const rate = getSocialChargesRate(s, monthDate);
                monthCharges += r * (rate / 100);

                // Fixed costs
                const fixedCosts = calculateServiceFixedCosts(s, selectedYear, month);
                monthFixed += fixedCosts.hosting + fixedCosts.database + fixedCosts.domains + fixedCosts.customRecurring;
                monthOneShot += fixedCosts.customOneShot;
            });

            totalRevenue += monthRevenue;
            totalCharges += monthCharges;
            totalFixed += monthFixed;
            totalOneShot += monthOneShot;

            monthlyData.push({
                name: new Date(selectedYear, month, 1).toLocaleDateString('fr-FR', { month: 'short' }),
                Revenu: monthRevenue,
                Net: monthRevenue - monthCharges - monthFixed - monthOneShot,
                Charges: monthCharges + monthFixed,
                OneShot: monthOneShot
            });
        }

        const monthlyRevenue = totalRevenue / 12;
        const monthlyCharges = totalCharges / 12;
        const monthlyFixed = totalFixed / 12;
        // Net monthly smoothed should probably NOT include one-shot? 
        // Or should it? "Net Mensuel (lissé)" usually implies recurring.
        // But "Net Annuel" definitely includes it.
        // Let's keep one-shot out of "monthly smoothed" metrics if it's truly one-shot, 
        // but the user asked for it to be in the totals.
        // If I divide totalOneShot by 12, it becomes smoothed.
        const monthlyOneShot = totalOneShot / 12;
        const monthlyNet = monthlyRevenue - monthlyCharges - monthlyFixed - monthlyOneShot;

        return {
            monthly: {
                revenue: monthlyRevenue,
                charges: monthlyCharges,
                fixed: monthlyFixed,
                oneShot: monthlyOneShot,
                net: monthlyNet
            },
            annual: {
                revenue: totalRevenue,
                charges: totalCharges,
                fixed: totalFixed,
                oneShot: totalOneShot,
                net: totalRevenue - totalCharges - totalFixed - totalOneShot
            },
            chartData: monthlyData
        };
    }, [simulation.services, selectedYear]);

    const formatEuro = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // State for resizable columns
    const [resultsWidth, setResultsWidth] = useState(() => {
        const saved = localStorage.getItem('simulation_results_width');
        return saved ? parseInt(saved, 10) : 400;
    });
    const [isResizing, setIsResizing] = useState(false);

    // Persist width when it changes (debouncing could be better but simple effect works for now)
    React.useEffect(() => {
        localStorage.setItem('simulation_results_width', resultsWidth);
    }, [resultsWidth]);

    const startResizing = React.useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            // Calculate new width based on mouse position from the right edge of the screen
            // Since the results column is on the right, its width is: Window Width - Mouse X
            // But we need to be careful about the container context.
            // A simpler way for a right sidebar:
            // New Width = Previous Width + (Previous Mouse X - Current Mouse X)
            // Actually, let's just use absolute position from right edge:
            const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;

            // Constraints
            if (newWidth >= 300 && newWidth <= document.body.clientWidth * 0.6) {
                setResultsWidth(newWidth);
            }
        }
    }, [isResizing]);

    React.useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-slate-100">
            {/* Left Column: Services (Scrollable) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-slate-700">Services ({simulation.services.length})</h2>
                        <div className="text-sm text-slate-500">
                            Total mensuel estimé: <span className="font-medium text-indigo-600">{formatEuro(results.monthly.revenue)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pb-20">
                        {simulation.services.map((service) => (
                            <ServiceItem
                                key={service.id}
                                service={service}
                                onUpdate={(field, value) => updateService(service.id, field, value)}
                                onRemove={() => removeService(service.id)}
                                onDuplicate={() => handleDuplicateClick(service.id)}
                            />
                        ))}

                        {/* Add Service Button - Circular below list */}
                        <div className="flex justify-center pt-4 pb-8">
                            <button
                                onClick={addService}
                                className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center"
                                title="Ajouter un service"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Resizer Handle */}
            <div
                className={`w-1 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-colors z-30 flex flex-col justify-center items-center group ${isResizing ? 'bg-indigo-500 w-2' : ''}`}
                onMouseDown={startResizing}
            >
                <div className="h-8 w-0.5 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* Right Column: Results (Resizable) */}
            <div
                className="bg-white shadow-xl border-l border-slate-200 flex flex-col z-20"
                style={{ width: resultsWidth, minWidth: 300 }}
            >
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Résultats</h2>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            {yearOptions.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${selectedYear === year
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Net Mensuel</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">{formatEuro(results.monthly.net)}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Net Annuel</span>
                            </div>
                            <p className="text-2xl font-bold text-indigo-700">{formatEuro(results.annual.net)}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="h-64 mb-6 w-full">
                        <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">Projection {selectedYear}</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    interval={2}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="Revenu" fill="#e2e8f0" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} stackId="b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detailed Table */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Détails financiers</p>
                        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 px-4 text-slate-600">Chiffre d'affaires</td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-900">{formatEuro(results.annual.revenue)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 px-4 text-slate-600">Charges sociales</td>
                                        <td className="py-3 px-4 text-right font-medium text-red-600">-{formatEuro(results.annual.charges)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 px-4 text-slate-600">Frais fixes</td>
                                        <td className="py-3 px-4 text-right font-medium text-orange-600">-{formatEuro(results.annual.fixed)}</td>
                                    </tr>
                                    {results.annual.oneShot > 0 && (
                                        <tr className="border-b border-slate-200">
                                            <td className="py-3 px-4 text-slate-600">Frais ponctuels</td>
                                            <td className="py-3 px-4 text-right font-medium text-purple-600">-{formatEuro(results.annual.oneShot)}</td>
                                        </tr>
                                    )}
                                    <tr className="bg-slate-100">
                                        <td className="py-3 px-4 font-semibold text-slate-800">Résultat Net</td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatEuro(results.annual.net)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de duplication */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Dupliquer le service</h3>

                        <div className="space-y-4">
                            {/* Radio boutons pour choisir la destination */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="duplicateDestination"
                                        value="current"
                                        checked={duplicateDestination === 'current'}
                                        onChange={(e) => setDuplicateDestination(e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span className="text-sm text-slate-700">Dans la feuille courante</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="duplicateDestination"
                                        value="other"
                                        checked={duplicateDestination === 'other'}
                                        onChange={(e) => setDuplicateDestination(e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span className="text-sm text-slate-700">Dans une autre feuille</span>
                                </label>
                            </div>

                            {/* Dropdown pour sélectionner une autre feuille */}
                            {duplicateDestination === 'other' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Sélectionner la feuille de destination
                                    </label>
                                    <select
                                        value={selectedTargetSimId || ''}
                                        onChange={(e) => setSelectedTargetSimId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">-- Choisir une feuille --</option>
                                        {otherSimulations.map(sim => (
                                            <option key={sim.id} value={sim.id}>
                                                {sim.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Boutons d'action */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCancelDuplicate}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmDuplicate}
                                    disabled={duplicateDestination === 'other' && !selectedTargetSimId}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Dupliquer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
