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
    const [duplicateDestination, setDuplicateDestination] = useState('current');
    const [selectedTargetSimId, setSelectedTargetSimId] = useState(null);

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

    const addService = () => {
        const newServices = [...simulation.services, {
            id: Date.now(),
            name: '',
            price: 0,
            quantity: 0,
            frequency: 'mois',
            params: {
                socialChargesRate: 25
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

    const results = useMemo(() => {
        let totalRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;

        const monthlyData = [];

        for (let month = 0; month < 12; month++) {
            let monthRevenue = 0;
            let monthCharges = 0;
            let monthFixed = 0;
            let monthOneShot = 0;

            simulation.services.forEach(s => {
                const r = calculateServiceRevenue(s, selectedYear, month);
                monthRevenue += r;

                const monthDate = new Date(selectedYear, month, 1);
                const rate = getSocialChargesRate(s, monthDate);
                monthCharges += r * (rate / 100);

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

    const [resultsWidth, setResultsWidth] = useState(() => {
        const saved = localStorage.getItem('simulation_results_width');
        return saved ? parseInt(saved, 10) : 400;
    });
    const [isResizing, setIsResizing] = useState(false);

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
            const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="liquid-glass-strong p-3 rounded-lg shadow-lg">
                    <p className="font-semibold mb-2 text-white">{label}</p>
                    <div className="space-y-1 text-sm">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex justify-between gap-4" style={{ color: entry.color }}>
                                <span>{entry.name}:</span>
                                <span className="font-medium">{formatEuro(entry.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[calc(100vh-80px)] flex overflow-hidden">
            {/* Left Column: Services (Scrollable) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-white">Services ({simulation.services.length})</h2>
                        <div className="text-sm text-liquid-muted">
                            Total mensuel estimé: <span className="font-medium text-liquid-primary">{formatEuro(results.monthly.revenue)}</span>
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
                                className="w-14 h-14 liquid-button-primary rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
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
                className={`w-1 hover:w-2 liquid-glass hover:bg-amber-500/50 cursor-col-resize transition-colors z-30 flex flex-col justify-center items-center group ${isResizing ? 'bg-amber-500/50 w-2' : ''}`}
                onMouseDown={startResizing}
            >
                <div className="h-8 w-0.5 bg-white/20 group-hover:bg-white/50 rounded-full transition-colors" />
            </div>

            {/* Right Column: Results (Resizable) */}
            <div
                className="liquid-glass-strong border-l border-liquid flex flex-col z-20"
                style={{ width: resultsWidth, minWidth: 300 }}
            >
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white text-glow-gold">Résultats</h2>
                        <div className="flex liquid-glass-light rounded-lg p-1">
                            {yearOptions.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${selectedYear === year
                                        ? 'liquid-glass-strong text-liquid-primary'
                                        : 'text-liquid-subtle hover:text-white'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="liquid-card p-4 rounded-xl border-l-4 border-emerald-500">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Net Mensuel</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{formatEuro(results.monthly.net)}</p>
                        </div>
                        <div className="liquid-card p-4 rounded-xl border-l-4 border-violet-500">
                            <div className="flex items-center gap-2 text-violet-400 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Net Annuel</span>
                            </div>
                            <p className="text-2xl font-bold text-violet-400">{formatEuro(results.annual.net)}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="h-64 mb-6 w-full">
                        <p className="text-xs font-semibold text-liquid-subtle mb-4 uppercase tracking-wider">Projection {selectedYear}</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                                    interval={2}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="Revenu" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} stackId="b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detailed Table */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-liquid-subtle uppercase tracking-wider">Détails financiers</p>
                        <div className="liquid-glass rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 text-liquid-muted">Chiffre d'affaires</td>
                                        <td className="py-3 px-4 text-right font-medium text-white">{formatEuro(results.annual.revenue)}</td>
                                    </tr>
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 text-liquid-muted">Charges sociales</td>
                                        <td className="py-3 px-4 text-right font-medium text-red-400">-{formatEuro(results.annual.charges)}</td>
                                    </tr>
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 text-liquid-muted">Frais fixes</td>
                                        <td className="py-3 px-4 text-right font-medium text-orange-400">-{formatEuro(results.annual.fixed)}</td>
                                    </tr>
                                    {results.annual.oneShot > 0 && (
                                        <tr className="border-b border-liquid">
                                            <td className="py-3 px-4 text-liquid-muted">Frais ponctuels</td>
                                            <td className="py-3 px-4 text-right font-medium text-purple-400">-{formatEuro(results.annual.oneShot)}</td>
                                        </tr>
                                    )}
                                    <tr className="liquid-glass-strong">
                                        <td className="py-3 px-4 font-semibold text-white">Résultat Net</td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatEuro(results.annual.net)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de duplication */}
            {showDuplicateModal && (
                <div className="fixed inset-0 liquid-overlay flex items-center justify-center z-50">
                    <div className="liquid-glass-strong rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-white mb-4">Dupliquer le service</h3>

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
                                        className="w-4 h-4 text-amber-500"
                                    />
                                    <span className="text-sm text-liquid-muted">Dans la feuille courante</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="duplicateDestination"
                                        value="other"
                                        checked={duplicateDestination === 'other'}
                                        onChange={(e) => setDuplicateDestination(e.target.value)}
                                        className="w-4 h-4 text-amber-500"
                                    />
                                    <span className="text-sm text-liquid-muted">Dans une autre feuille</span>
                                </label>
                            </div>

                            {/* Dropdown pour sélectionner une autre feuille */}
                            {duplicateDestination === 'other' && (
                                <div>
                                    <label className="block text-sm font-medium text-liquid-muted mb-2">
                                        Sélectionner la feuille de destination
                                    </label>
                                    <select
                                        value={selectedTargetSimId || ''}
                                        onChange={(e) => setSelectedTargetSimId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 liquid-select rounded-lg"
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
                                    className="flex-1 px-4 py-2.5 liquid-button rounded-xl font-medium cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmDuplicate}
                                    disabled={duplicateDestination === 'other' && !selectedTargetSimId}
                                    className="flex-1 px-4 py-2.5 liquid-button-cta rounded-xl font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
