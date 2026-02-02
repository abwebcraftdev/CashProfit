import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, X, Check, Calculator, TrendingUp } from 'lucide-react';
import {
    aggregateDashboardData,
    aggregateMonthlyData,
    aggregateQuarterlyData,
    aggregateYearlyData,
    aggregateMonthlyDataWithMode,
    aggregateQuarterlyDataWithMode,
    aggregateYearlyDataWithMode,
    START_YEAR
} from '../utils/calculations';

const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
];

const DashboardSettings = ({
    isOpen,
    onClose,
    visibleCategories,
    setVisibleCategories,
    simulations,
    visibleSimulations,
    setVisibleSimulations,
    simulationColors,
    setSimulationColors
}) => {
    if (!isOpen) return null;

    const toggleCategory = (key) => {
        setVisibleCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSimulation = (id) => {
        setVisibleSimulations(prev => {
            if (prev.includes(id)) {
                return prev.filter(simId => simId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleColorChange = (id, color) => {
        setSimulationColors(prev => ({ ...prev, [id]: color }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800">Paramètres d'affichage</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Categories Section */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Données à afficher</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleCategories.revenue ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {visibleCategories.revenue && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.revenue} onChange={() => toggleCategory('revenue')} />
                                <span className="text-slate-700 font-medium">Chiffre d'affaires</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleCategories.charges ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {visibleCategories.charges && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.charges} onChange={() => toggleCategory('charges')} />
                                <span className="text-slate-700 font-medium">Charges sociales</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleCategories.fixed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {visibleCategories.fixed && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.fixed} onChange={() => toggleCategory('fixed')} />
                                <span className="text-slate-700 font-medium">Frais fixes</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleCategories.oneshot ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {visibleCategories.oneshot && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.oneshot} onChange={() => toggleCategory('oneshot')} />
                                <span className="text-slate-700 font-medium">Frais ponctuels</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleCategories.net ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {visibleCategories.net && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.net} onChange={() => toggleCategory('net')} />
                                <span className="text-slate-700 font-medium">Résultat net</span>
                            </label>
                        </div>
                    </section>

                    {/* Simulations Section */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Simulations actives</h4>
                        <div className="space-y-3">
                            {simulations.filter(s => !s.isTest).map((sim, index) => (
                                <div key={sim.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${visibleSimulations.includes(sim.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {visibleSimulations.includes(sim.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={visibleSimulations.includes(sim.id)}
                                            onChange={() => toggleSimulation(sim.id)}
                                        />
                                        <span className="text-slate-700 font-medium">{sim.name || `Simulation ${index + 1}`}</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Couleur:</span>
                                        <input
                                            type="color"
                                            value={simulationColors[sim.id] || COLORS[index % COLORS.length]}
                                            onChange={(e) => handleColorChange(sim.id, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
                    >
                        Terminé
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard({ simulations }) {
    const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'financial'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [granularity, setGranularity] = useState('month'); // 'month', 'quarter', 'year'
    const [calculationMode, setCalculationMode] = useState('distributed'); // 'distributed' or 'actual'

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState({
        revenue: true,
        charges: true,
        fixed: true,
        oneshot: true,
        net: true
    });
    const [visibleSimulations, setVisibleSimulations] = useState([]);
    const [simulationColors, setSimulationColors] = useState({});

    const currentYear = new Date().getFullYear();

    // Initialize visible simulations and colors
    useEffect(() => {
        const activeSims = simulations.filter(s => !s.isTest);
        const newIds = activeSims.map(s => s.id);

        // Add new simulations to visible list if not already present (initial load)
        setVisibleSimulations(prev => {
            if (prev.length === 0 && newIds.length > 0) return newIds;
            // Optionally sync if simulations change? For now let's just ensure we have defaults
            return prev.length === 0 ? newIds : prev;
        });

        // Initialize colors
        setSimulationColors(prev => {
            const newColors = { ...prev };
            activeSims.forEach((sim, index) => {
                if (!newColors[sim.id]) {
                    newColors[sim.id] = COLORS[index % COLORS.length];
                }
            });
            return newColors;
        });
    }, [simulations]);

    // Filter simulations based on visibility
    const filteredSimulations = useMemo(() => {
        return simulations.filter(s => visibleSimulations.includes(s.id));
    }, [simulations, visibleSimulations]);

    const annualData = useMemo(() => aggregateDashboardData(filteredSimulations), [filteredSimulations]);

    // Generate year options (from START_YEAR to currentYear + 5)
    const yearOptions = Array.from(
        { length: currentYear - START_YEAR + 6 },
        (_, i) => START_YEAR + i
    );

    // Calculate data based on granularity and calculation mode
    const monthlyData = useMemo(() =>
        aggregateMonthlyDataWithMode(filteredSimulations, selectedYear, calculationMode),
        [filteredSimulations, selectedYear, calculationMode]
    );
    const quarterlyData = useMemo(() =>
        aggregateQuarterlyDataWithMode(filteredSimulations, selectedYear, calculationMode),
        [filteredSimulations, selectedYear, calculationMode]
    );
    const yearlyData = useMemo(() =>
        aggregateYearlyDataWithMode(filteredSimulations, selectedYear, calculationMode),
        [filteredSimulations, selectedYear, calculationMode]
    );

    // Select data based on granularity
    const periodData = useMemo(() => {
        switch (granularity) {
            case 'month':
                return monthlyData;
            case 'quarter':
                return quarterlyData;
            case 'year':
                return yearlyData;
            default:
                return monthlyData;
        }
    }, [granularity, monthlyData, quarterlyData, yearlyData]);

    const formatEuro = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Helper to determine if we should show breakdown by simulation
    // Logic: If ONLY "Net" is selected (and maybe others are unchecked), we show breakdown.
    // Or maybe if "Net" is selected AND others are NOT?
    // User said: "si on sélectionne uniquement le résultat net On va pouvoir voir la part du résultat net. calculée pour chaque feuille indépendante."
    const isNetBreakdownMode = useMemo(() => {
        return visibleCategories.net && !visibleCategories.revenue && !visibleCategories.charges && !visibleCategories.fixed && !visibleCategories.oneshot;
    }, [visibleCategories]);

    // Prepare data for charts
    // We need to handle the "Net Breakdown" mode specially

    // Helper to get per-simulation data for a specific period (month/quarter/year)
    // This is a bit complex because aggregate functions return totals.
    // We might need to re-aggregate if in breakdown mode.
    // Actually, for breakdown mode, we need data structured like: { month: 'Jan', sim1_net: 100, sim2_net: 200, ... }

    const breakdownData = useMemo(() => {
        if (!isNetBreakdownMode) return [];

        // We need to calculate net for each visible simulation for the selected period/year
        // Let's reuse the existing aggregation logic but call it for each simulation individually

        let baseData = [];
        if (granularity === 'month') {
            baseData = Array.from({ length: 12 }, (_, i) => ({
                monthIndex: i,
                label: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i]
            }));
        } else if (granularity === 'quarter') {
            baseData = ['T1', 'T2', 'T3', 'T4'].map(q => ({ label: q }));
        } else {
            baseData = [{ label: selectedYear.toString() }];
        }

        // For each visible simulation, calculate its data and merge into baseData
        filteredSimulations.forEach(sim => {
            let simData = [];
            if (granularity === 'month') {
                simData = aggregateMonthlyData([sim], selectedYear);
            } else if (granularity === 'quarter') {
                simData = aggregateQuarterlyData([sim], selectedYear);
            } else {
                simData = aggregateYearlyData([sim], selectedYear);
            }

            simData.forEach((item, index) => {
                if (baseData[index]) {
                    baseData[index][sim.id] = item.Net;
                }
            });
        });

        return baseData;
    }, [isNetBreakdownMode, filteredSimulations, granularity, selectedYear]);

    const chartData = useMemo(() => {
        if (isNetBreakdownMode) {
            return breakdownData;
        }

        // Normal mode: filter categories in the aggregated data
        // Actually we don't filter the DATA, we just toggle the BARS.
        // But we should probably zero out values if we want them to disappear from tooltip?
        // Or just not render the Bar component.
        return periodData.map(item => ({
            ...item,
            label: item.month || item.period || item.year, // Normalize label
        }));
    }, [isNetBreakdownMode, breakdownData, periodData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-semibold mb-2">{label || payload[0].payload.label}</p>
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

    const getXAxisKey = () => {
        if (isNetBreakdownMode) return 'label';
        switch (granularity) {
            case 'month': return 'month';
            case 'quarter': return 'period';
            case 'year': return 'period';
            default: return 'month';
        }
    };

    const getChartTitle = () => {
        if (viewType === 'monthly') {
            const granularityLabel = {
                month: 'Mensuelle',
                quarter: 'Trimestrielle',
                year: 'Annuelle'
            }[granularity] || 'Mensuelle';
            return `Projection ${granularityLabel} ${selectedYear}`;
        }
        return 'Projection Financière (5 ans)';
    };

    if (annualData.length === 0 && periodData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p className="text-lg">Aucune donnée à afficher.</p>
                <p className="text-sm">Créez une simulation (non-test) pour voir les projections.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <DashboardSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                visibleCategories={visibleCategories}
                setVisibleCategories={setVisibleCategories}
                simulations={simulations}
                visibleSimulations={visibleSimulations}
                setVisibleSimulations={setVisibleSimulations}
                simulationColors={simulationColors}
                setSimulationColors={setSimulationColors}
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-600"
                        title="Paramètres d'affichage"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* Radio buttons pour choisir le type de vue */}
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="viewType"
                            value="monthly"
                            checked={viewType === 'monthly'}
                            onChange={(e) => setViewType(e.target.value)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">Projection Mensuelle</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="viewType"
                            value="financial"
                            checked={viewType === 'financial'}
                            onChange={(e) => setViewType(e.target.value)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">Projection Financière</span>
                    </label>
                </div>

                {/* Contrôles pour la projection mensuelle */}
                {viewType === 'monthly' && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            >
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setGranularity('month')}
                                className={`px-3 py-1 rounded-lg text-sm transition ${granularity === 'month'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                Mois
                            </button>
                            <button
                                onClick={() => setGranularity('quarter')}
                                className={`px-3 py-1 rounded-lg text-sm transition ${granularity === 'quarter'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                Trimestre
                            </button>
                            <button
                                onClick={() => setGranularity('year')}
                                className={`px-3 py-1 rounded-lg text-sm transition ${granularity === 'year'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                Annee
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Mode Projet / Comptable */}
            {viewType === 'monthly' && (
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-600">Mode de calcul:</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setCalculationMode('distributed')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                                        calculationMode === 'distributed'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800'
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Projet
                                </button>
                                <button
                                    onClick={() => setCalculationMode('actual')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                                        calculationMode === 'actual'
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800'
                                    }`}
                                >
                                    <Calculator className="w-4 h-4" />
                                    Comptable (URSSAF)
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            {calculationMode === 'actual' && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                        <span>CA Recu</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded" style={{
                                            background: 'repeating-linear-gradient(45deg, #93c5fd, #93c5fd 2px, #3b82f6 2px, #3b82f6 4px)'
                                        }}></div>
                                        <span>CA En attente</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                        {calculationMode === 'distributed'
                            ? 'Revenus repartis sur la duree du projet'
                            : 'Revenus comptabilises a la date de paiement'
                        }
                    </p>
                </div>
            )}

            {/* Graphique principal */}
            {viewType === 'monthly' && periodData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg h-96">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">{getChartTitle()}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={getXAxisKey()} />
                            <YAxis tickFormatter={(val) => `${val / 1000}k€`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* Pattern hachure bleu pour revenus en attente */}
                            <defs>
                                <pattern id="pending-pattern" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                                    <rect width="6" height="6" fill="#93c5fd" />
                                    <line x1="0" y1="0" x2="0" y2="6" stroke="#3b82f6" strokeWidth="3" />
                                </pattern>
                            </defs>

                            {isNetBreakdownMode ? (
                                // Render a bar for each visible simulation
                                filteredSimulations.map((sim) => (
                                    <Bar
                                        key={sim.id}
                                        dataKey={sim.id}
                                        stackId="a"
                                        fill={simulationColors[sim.id]}
                                        name={sim.name || "Simulation"}
                                    />
                                ))
                            ) : (
                                // Render standard categories based on visibility
                                <>
                                    {calculationMode === 'distributed' ? (
                                        // Mode Projet: affichage standard
                                        <>
                                            {visibleCategories.net && <Bar dataKey="Net" stackId="a" fill="#10b981" name="Resultat Net" />}
                                            {visibleCategories.charges && <Bar dataKey="Charges" stackId="a" fill="#ef4444" name="Charges Sociales" />}
                                            {visibleCategories.fixed && <Bar dataKey="Fixed" stackId="a" fill="#f97316" name="Frais Fixes" />}
                                            {visibleCategories.oneshot && <Bar dataKey="OneShot" stackId="a" fill="#9333ea" name="Frais Ponctuels" />}
                                        </>
                                    ) : (
                                        // Mode Comptable: 3 groupes de barres
                                        // Groupe 1: CA (Recu + En attente empiles)
                                        // Groupe 2: Couts (Charges + Frais fixes empiles)
                                        // Groupe 3: Resultat Net
                                        <>
                                            {visibleCategories.revenue && <Bar dataKey="Revenue" stackId="revenue" fill="#3b82f6" name="CA Recu" />}
                                            {visibleCategories.revenue && <Bar dataKey="PendingRevenue" stackId="revenue" fill="url(#pending-pattern)" stroke="#3b82f6" strokeWidth={1} name="CA En attente" />}
                                            {visibleCategories.charges && <Bar dataKey="Charges" stackId="costs" fill="#ef4444" name="Charges Sociales" />}
                                            {visibleCategories.fixed && <Bar dataKey="Fixed" stackId="costs" fill="#f97316" name="Frais Fixes" />}
                                            {visibleCategories.oneshot && <Bar dataKey="OneShot" stackId="costs" fill="#9333ea" name="Frais Ponctuels" />}
                                            {visibleCategories.net && <Bar dataKey="Net" fill="#10b981" name="Resultat Net" />}
                                        </>
                                    )}
                                </>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Graphique annuel de projection */}
            {viewType === 'financial' && annualData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg h-96">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">{getChartTitle()}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={annualData.map(item => ({ ...item, year: item.year }))}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={(val) => `${val / 1000}k€`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {visibleCategories.net && <Bar dataKey="Net" stackId="a" fill="#10b981" name="Résultat Net" />}
                            {visibleCategories.charges && <Bar dataKey="Charges" stackId="a" fill="#ef4444" name="Charges Sociales" />}
                            {visibleCategories.fixed && <Bar dataKey="Fixed" stackId="a" fill="#f97316" name="Frais Fixes" />}
                            {visibleCategories.oneshot && <Bar dataKey="OneShot" stackId="a" fill="#9333ea" name="Frais Ponctuels" />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Cartes récapitulatives pour projection financière */}
            {viewType === 'financial' && annualData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {annualData.map((yearData) => (
                        <div key={yearData.year} className="bg-white p-4 rounded-xl shadow border border-slate-100">
                            <h4 className="font-bold text-slate-600 mb-2">{yearData.year}</h4>
                            <div className="space-y-1 text-sm">
                                {visibleCategories.revenue && (
                                    <div className="flex justify-between">
                                        <span>CA:</span>
                                        <span className="font-medium">{formatEuro(yearData.Revenue)}</span>
                                    </div>
                                )}
                                {visibleCategories.charges && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Charges:</span>
                                        <span>-{formatEuro(yearData.Charges)}</span>
                                    </div>
                                )}
                                {visibleCategories.fixed && (
                                    <div className="flex justify-between text-orange-500">
                                        <span>Fixes:</span>
                                        <span>-{formatEuro(yearData.Fixed)}</span>
                                    </div>
                                )}
                                {visibleCategories.oneshot && yearData.OneShot > 0 && (
                                    <div className="flex justify-between text-purple-500">
                                        <span>Ponctuels:</span>
                                        <span>-{formatEuro(yearData.OneShot)}</span>
                                    </div>
                                )}
                                {visibleCategories.net && (
                                    <div className="border-t pt-1 mt-1 flex justify-between font-bold text-emerald-600">
                                        <span>Net:</span>
                                        <span>{formatEuro(yearData.Net)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tableau dynamique pour projection mensuelle */}
            {viewType === 'monthly' && periodData.length > 0 && !isNetBreakdownMode && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Détails {getChartTitle()}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700 sticky left-0 bg-white z-10">
                                        Résultat
                                    </th>
                                    {periodData.map((item, index) => {
                                        const periodLabel = item.month || item.period || `Période ${index + 1}`;
                                        return (
                                            <th key={index} className="text-right py-3 px-4 font-semibold text-slate-700 min-w-[100px]">
                                                {periodLabel}
                                            </th>
                                        );
                                    })}
                                    <th className="text-right py-3 px-4 font-semibold text-slate-700 bg-slate-100 min-w-[100px]">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Ligne CA */}
                                {visibleCategories.revenue && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 font-medium text-slate-800 sticky left-0 bg-white z-10">
                                            CA {calculationMode === 'actual' && <span className="text-xs text-emerald-600">(recu)</span>}
                                        </td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4">{formatEuro(item.Revenue)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-slate-800 bg-slate-100">
                                            {formatEuro(periodData.reduce((sum, item) => sum + item.Revenue, 0))}
                                        </td>
                                    </tr>
                                )}
                                {/* Ligne CA en attente (mode comptable uniquement) */}
                                {calculationMode === 'actual' && visibleCategories.revenue && (
                                    <tr className="border-b border-slate-100 bg-emerald-50">
                                        <td className="py-3 px-4 font-medium text-emerald-600 sticky left-0 bg-emerald-50 z-10">
                                            CA <span className="text-xs">(en attente)</span>
                                        </td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-emerald-600">
                                                {item.PendingRevenue > 0 ? formatEuro(item.PendingRevenue) : '-'}
                                            </td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-emerald-600 bg-slate-100">
                                            {formatEuro(periodData.reduce((sum, item) => sum + (item.PendingRevenue || 0), 0))}
                                        </td>
                                    </tr>
                                )}
                                {/* Ligne Charges */}
                                {visibleCategories.charges && (
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-red-600 sticky left-0 bg-slate-50 z-10">Charges</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-red-600">-{formatEuro(item.Charges)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-red-600 bg-slate-100">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.Charges, 0))}
                                        </td>
                                    </tr>
                                )}
                                {/* Ligne Frais fixes */}
                                {visibleCategories.fixed && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 font-medium text-orange-600 sticky left-0 bg-white z-10">Frais fixes</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-orange-600">-{formatEuro(item.Fixed)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-orange-600 bg-slate-100">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.Fixed, 0))}
                                        </td>
                                    </tr>
                                )}
                                {/* Ligne Frais ponctuels */}
                                {visibleCategories.oneshot && (
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-purple-600 sticky left-0 bg-slate-50 z-10">Frais ponctuels</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-purple-600">-{formatEuro(item.OneShot)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-purple-600 bg-slate-100">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.OneShot, 0))}
                                        </td>
                                    </tr>
                                )}
                                {/* Ligne Net */}
                                {visibleCategories.net && (
                                    <tr className="border-t-2 border-slate-300">
                                        <td className="py-3 px-4 font-bold text-emerald-600 sticky left-0 bg-white z-10">Net</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 font-bold text-emerald-600">{formatEuro(item.Net)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-bold text-emerald-600 bg-slate-100">
                                            {formatEuro(periodData.reduce((sum, item) => sum + item.Net, 0))}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
