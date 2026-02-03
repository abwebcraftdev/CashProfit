import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, X, Check, Calculator, TrendingUp, Wallet, Receipt, PiggyBank, Clock } from 'lucide-react';
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
    '#F59E0B', '#8B5CF6', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#6366f1', '#14b8a6'
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
        <div className="fixed inset-0 liquid-overlay z-50 flex items-center justify-center p-4">
            <div className="liquid-glass-strong rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-liquid-strong flex justify-between items-center sticky top-0 liquid-glass-strong z-10 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white">Paramètres d'affichage</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
                        <X className="w-5 h-5 text-liquid-muted" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Categories Section */}
                    <section>
                        <h4 className="text-sm font-semibold text-liquid-primary uppercase tracking-wider mb-4">Données à afficher</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-3 liquid-glass rounded-lg cursor-pointer hover:bg-white/5 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleCategories.revenue ? 'bg-amber-500 border-amber-500' : 'border-liquid-strong'}`}>
                                    {visibleCategories.revenue && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.revenue} onChange={() => toggleCategory('revenue')} />
                                <span className="text-white font-medium">Chiffre d'affaires</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 liquid-glass rounded-lg cursor-pointer hover:bg-white/5 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleCategories.charges ? 'bg-amber-500 border-amber-500' : 'border-liquid-strong'}`}>
                                    {visibleCategories.charges && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.charges} onChange={() => toggleCategory('charges')} />
                                <span className="text-white font-medium">Charges sociales</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 liquid-glass rounded-lg cursor-pointer hover:bg-white/5 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleCategories.fixed ? 'bg-amber-500 border-amber-500' : 'border-liquid-strong'}`}>
                                    {visibleCategories.fixed && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.fixed} onChange={() => toggleCategory('fixed')} />
                                <span className="text-white font-medium">Frais fixes</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 liquid-glass rounded-lg cursor-pointer hover:bg-white/5 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleCategories.oneshot ? 'bg-amber-500 border-amber-500' : 'border-liquid-strong'}`}>
                                    {visibleCategories.oneshot && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.oneshot} onChange={() => toggleCategory('oneshot')} />
                                <span className="text-white font-medium">Frais ponctuels</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 liquid-glass rounded-lg cursor-pointer hover:bg-white/5 transition">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleCategories.net ? 'bg-amber-500 border-amber-500' : 'border-liquid-strong'}`}>
                                    {visibleCategories.net && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={visibleCategories.net} onChange={() => toggleCategory('net')} />
                                <span className="text-white font-medium">Résultat net</span>
                            </label>
                        </div>
                    </section>

                    {/* Simulations Section */}
                    <section>
                        <h4 className="text-sm font-semibold text-liquid-cta uppercase tracking-wider mb-4">Simulations actives</h4>
                        <div className="space-y-3">
                            {simulations.filter(s => !s.isTest).map((sim, index) => (
                                <div key={sim.id} className="flex items-center justify-between p-3 liquid-glass rounded-lg hover:bg-white/5 transition">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibleSimulations.includes(sim.id) ? 'bg-violet-500 border-violet-500' : 'border-liquid-strong'}`}>
                                            {visibleSimulations.includes(sim.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={visibleSimulations.includes(sim.id)}
                                            onChange={() => toggleSimulation(sim.id)}
                                        />
                                        <span className="text-white font-medium">{sim.name || `Simulation ${index + 1}`}</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-liquid-subtle">Couleur:</span>
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

                <div className="p-6 border-t border-liquid liquid-glass rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 liquid-button-primary rounded-xl font-medium cursor-pointer"
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

        setVisibleSimulations(prev => {
            if (prev.length === 0 && newIds.length > 0) return newIds;
            return prev.length === 0 ? newIds : prev;
        });

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

    const filteredSimulations = useMemo(() => {
        return simulations.filter(s => visibleSimulations.includes(s.id));
    }, [simulations, visibleSimulations]);

    const annualData = useMemo(() => aggregateDashboardData(filteredSimulations), [filteredSimulations]);

    const yearOptions = Array.from(
        { length: currentYear - START_YEAR + 6 },
        (_, i) => START_YEAR + i
    );

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

    const periodData = useMemo(() => {
        switch (granularity) {
            case 'month': return monthlyData;
            case 'quarter': return quarterlyData;
            case 'year': return yearlyData;
            default: return monthlyData;
        }
    }, [granularity, monthlyData, quarterlyData, yearlyData]);

    // Calcul des totaux pour les cartes métriques (adapté à la granularité)
    const metricsTotals = useMemo(() => {
        let currentData = { Revenue: 0, Charges: 0, Net: 0 };
        let prevData = { Revenue: 0, Charges: 0, Net: 0 };
        let periodLabel = 'mois';

        const currentMonth = new Date().getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);

        if (granularity === 'month') {
            currentData = monthlyData[currentMonth] || { Revenue: 0, Charges: 0, Net: 0 };
            prevData = monthlyData[currentMonth - 1] || { Revenue: 0, Charges: 0, Net: 0 };
            periodLabel = 'mois';
        } else if (granularity === 'quarter') {
            currentData = quarterlyData[currentQuarter] || { Revenue: 0, Charges: 0, Net: 0 };
            prevData = quarterlyData[currentQuarter - 1] || { Revenue: 0, Charges: 0, Net: 0 };
            periodLabel = 'trimestre';
        } else if (granularity === 'year') {
            currentData = yearlyData[0] || { Revenue: 0, Charges: 0, Net: 0 };
            periodLabel = 'annee';
        }

        // Calculer les paiements reçus et en attente depuis les services
        let paymentsReceived = 0;
        let paymentsPending = 0;

        filteredSimulations.forEach(sim => {
            sim.services?.forEach(service => {
                service.payments?.forEach(payment => {
                    const amount = payment.percentage
                        ? (service.price * service.quantity * (payment.percentage / 100))
                        : (payment.amount || 0);

                    if (payment.status === 'received') {
                        paymentsReceived += amount;
                    } else if (payment.status === 'pending') {
                        paymentsPending += amount;
                    }
                });
            });
        });

        // Calculer le % de variation
        const revenueChange = prevData.Revenue > 0
            ? Math.round(((currentData.Revenue - prevData.Revenue) / prevData.Revenue) * 100)
            : 0;

        return {
            revenue: currentData.Revenue || 0,
            charges: currentData.Charges || 0,
            net: currentData.Net || 0,
            paymentsReceived,
            paymentsPending,
            revenueChange,
            periodLabel
        };
    }, [monthlyData, quarterlyData, yearlyData, granularity, filteredSimulations]);

    const formatEuro = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const isNetBreakdownMode = useMemo(() => {
        return visibleCategories.net && !visibleCategories.revenue && !visibleCategories.charges && !visibleCategories.fixed && !visibleCategories.oneshot;
    }, [visibleCategories]);

    const breakdownData = useMemo(() => {
        if (!isNetBreakdownMode) return [];

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
        return periodData.map(item => ({
            ...item,
            label: item.month || item.period || item.year,
        }));
    }, [isNetBreakdownMode, breakdownData, periodData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="liquid-glass-strong p-3 rounded-lg shadow-lg">
                    <p className="font-semibold mb-2 text-white">{label || payload[0].payload.label}</p>
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
            <div className="flex flex-col items-center justify-center h-full text-liquid-subtle">
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 liquid-glass-strong p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white text-glow-gold">Tableau de bord</h2>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 liquid-button rounded-full transition cursor-pointer"
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
                            className="w-4 h-4 text-amber-500"
                        />
                        <span className="text-sm text-liquid-muted">Projection Mensuelle</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="viewType"
                            value="financial"
                            checked={viewType === 'financial'}
                            onChange={(e) => setViewType(e.target.value)}
                            className="w-4 h-4 text-amber-500"
                        />
                        <span className="text-sm text-liquid-muted">Projection Financière</span>
                    </label>
                </div>

                {/* Contrôles pour la projection mensuelle */}
                {viewType === 'monthly' && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 liquid-select rounded-lg text-sm"
                            >
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setGranularity('month')}
                                className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${granularity === 'month'
                                    ? 'liquid-button-primary'
                                    : 'liquid-button'
                                    }`}
                            >
                                Mois
                            </button>
                            <button
                                onClick={() => setGranularity('quarter')}
                                className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${granularity === 'quarter'
                                    ? 'liquid-button-primary'
                                    : 'liquid-button'
                                    }`}
                            >
                                Trimestre
                            </button>
                            <button
                                onClick={() => setGranularity('year')}
                                className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${granularity === 'year'
                                    ? 'liquid-button-primary'
                                    : 'liquid-button'
                                    }`}
                            >
                                Annee
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cartes métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CA Total */}
                <div className="liquid-card rounded-xl p-5 border-l-4 border-liquid-primary group hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-liquid-subtle text-xs font-medium uppercase tracking-wide mb-1">CA Total / {metricsTotals.periodLabel}</p>
                            <p className="text-3xl font-bold text-liquid-primary text-glow-gold">{formatEuro(metricsTotals.revenue)}</p>
                            {metricsTotals.revenueChange !== 0 && granularity !== 'year' && (
                                <p className={`text-xs mt-2 flex items-center gap-1 ${metricsTotals.revenueChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    <TrendingUp className={`w-3 h-3 ${metricsTotals.revenueChange < 0 ? 'rotate-180' : ''}`} />
                                    {metricsTotals.revenueChange > 0 ? '+' : ''}{metricsTotals.revenueChange}% vs {metricsTotals.periodLabel} dernier
                                </p>
                            )}
                        </div>
                        <div className="p-3 liquid-glass rounded-xl group-hover:bg-liquid-primary/20 transition">
                            <Wallet className="w-6 h-6 text-liquid-primary" />
                        </div>
                    </div>
                </div>

                {/* Charges sociales */}
                <div className="liquid-card rounded-xl p-5 border-l-4 border-red-400 group hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-liquid-subtle text-xs font-medium uppercase tracking-wide mb-1">Charges sociales</p>
                            <p className="text-3xl font-bold text-red-400">- {formatEuro(metricsTotals.charges)}</p>
                            <p className="text-xs mt-2 text-liquid-subtle">
                                {metricsTotals.revenue > 0 ? Math.round((metricsTotals.charges / metricsTotals.revenue) * 100) : 0}% du CA
                            </p>
                        </div>
                        <div className="p-3 liquid-glass rounded-xl group-hover:bg-red-500/20 transition">
                            <Receipt className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Bénéfice net */}
                <div className="liquid-card rounded-xl p-5 border-l-4 border-emerald-400 group hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-liquid-subtle text-xs font-medium uppercase tracking-wide mb-1">Benefice net</p>
                            <p className="text-3xl font-bold text-emerald-400">{formatEuro(metricsTotals.net)}</p>
                            <p className="text-xs mt-2 text-emerald-400">
                                {metricsTotals.revenue > 0 ? Math.round((metricsTotals.net / metricsTotals.revenue) * 100) : 0}% du CA
                            </p>
                        </div>
                        <div className="p-3 liquid-glass rounded-xl group-hover:bg-emerald-500/20 transition">
                            <PiggyBank className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Paiements reçus */}
                <div className="liquid-card rounded-xl p-5 border-l-4 border-liquid-cta group hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-liquid-subtle text-xs font-medium uppercase tracking-wide mb-1">Paiements recus</p>
                            <p className="text-3xl font-bold text-liquid-cta text-glow-violet">{formatEuro(metricsTotals.paymentsReceived)}</p>
                            {metricsTotals.paymentsPending > 0 && (
                                <p className="text-xs mt-2 text-amber-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatEuro(metricsTotals.paymentsPending)} en attente
                                </p>
                            )}
                        </div>
                        <div className="p-3 liquid-glass rounded-xl group-hover:bg-liquid-cta/20 transition">
                            <Check className="w-6 h-6 text-liquid-cta" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Mode Projet / Comptable */}
            {viewType === 'monthly' && (
                <div className="liquid-glass p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-liquid-muted">Mode de calcul:</span>
                            <div className="flex liquid-glass-light rounded-lg p-1">
                                <button
                                    onClick={() => setCalculationMode('distributed')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                                        calculationMode === 'distributed'
                                            ? 'liquid-glass-strong text-liquid-primary'
                                            : 'text-liquid-muted hover:text-white'
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Projet
                                </button>
                                <button
                                    onClick={() => setCalculationMode('actual')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                                        calculationMode === 'actual'
                                            ? 'liquid-glass-strong text-emerald-400'
                                            : 'text-liquid-muted hover:text-white'
                                    }`}
                                >
                                    <Calculator className="w-4 h-4" />
                                    Comptable (URSSAF)
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-liquid-subtle">
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
                    <p className="mt-2 text-xs text-liquid-subtle">
                        {calculationMode === 'distributed'
                            ? 'Revenus repartis sur la duree du projet'
                            : 'Revenus comptabilises a la date de paiement'
                        }
                    </p>
                </div>
            )}

            {/* Graphique principal */}
            {viewType === 'monthly' && periodData.length > 0 && (
                <div className="liquid-glass-strong p-6 rounded-2xl h-96">
                    <h3 className="text-lg font-semibold mb-4 text-white">{getChartTitle()}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={getXAxisKey()} stroke="rgba(255,255,255,0.5)" />
                            <YAxis tickFormatter={(val) => `${val / 1000}k€`} stroke="rgba(255,255,255,0.5)" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            <defs>
                                <pattern id="pending-pattern" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                                    <rect width="6" height="6" fill="#93c5fd" />
                                    <line x1="0" y1="0" x2="0" y2="6" stroke="#3b82f6" strokeWidth="3" />
                                </pattern>
                            </defs>

                            {isNetBreakdownMode ? (
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
                                <>
                                    {calculationMode === 'distributed' ? (
                                        <>
                                            {visibleCategories.net && <Bar dataKey="Net" stackId="a" fill="#10b981" name="Resultat Net" />}
                                            {visibleCategories.charges && <Bar dataKey="Charges" stackId="a" fill="#ef4444" name="Charges Sociales" />}
                                            {visibleCategories.fixed && <Bar dataKey="Fixed" stackId="a" fill="#f97316" name="Frais Fixes" />}
                                            {visibleCategories.oneshot && <Bar dataKey="OneShot" stackId="a" fill="#9333ea" name="Frais Ponctuels" />}
                                        </>
                                    ) : (
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
                <div className="liquid-glass-strong p-6 rounded-2xl h-96">
                    <h3 className="text-lg font-semibold mb-4 text-white">{getChartTitle()}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={annualData.map(item => ({ ...item, year: item.year }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                            <YAxis tickFormatter={(val) => `${val / 1000}k€`} stroke="rgba(255,255,255,0.5)" />
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
                        <div key={yearData.year} className="liquid-card p-4 rounded-xl">
                            <h4 className="font-bold text-liquid-primary mb-2">{yearData.year}</h4>
                            <div className="space-y-1 text-sm">
                                {visibleCategories.revenue && (
                                    <div className="flex justify-between">
                                        <span className="text-liquid-muted">CA:</span>
                                        <span className="font-medium text-white">{formatEuro(yearData.Revenue)}</span>
                                    </div>
                                )}
                                {visibleCategories.charges && (
                                    <div className="flex justify-between text-red-400">
                                        <span>Charges:</span>
                                        <span>-{formatEuro(yearData.Charges)}</span>
                                    </div>
                                )}
                                {visibleCategories.fixed && (
                                    <div className="flex justify-between text-orange-400">
                                        <span>Fixes:</span>
                                        <span>-{formatEuro(yearData.Fixed)}</span>
                                    </div>
                                )}
                                {visibleCategories.oneshot && yearData.OneShot > 0 && (
                                    <div className="flex justify-between text-purple-400">
                                        <span>Ponctuels:</span>
                                        <span>-{formatEuro(yearData.OneShot)}</span>
                                    </div>
                                )}
                                {visibleCategories.net && (
                                    <div className="border-t border-liquid pt-1 mt-1 flex justify-between font-bold text-emerald-400">
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
                <div className="liquid-glass-strong p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4 text-white">Détails {getChartTitle()}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-liquid-strong">
                                    <th className="text-left py-3 px-4 font-semibold text-liquid-muted sticky left-0 liquid-glass-strong z-10">
                                        Résultat
                                    </th>
                                    {periodData.map((item, index) => {
                                        const periodLabel = item.month || item.period || `Période ${index + 1}`;
                                        return (
                                            <th key={index} className="text-right py-3 px-4 font-semibold text-liquid-muted min-w-[100px]">
                                                {periodLabel}
                                            </th>
                                        );
                                    })}
                                    <th className="text-right py-3 px-4 font-semibold text-liquid-primary liquid-glass min-w-[100px]">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleCategories.revenue && (
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 font-medium text-white sticky left-0 liquid-glass-strong z-10">
                                            CA {calculationMode === 'actual' && <span className="text-xs text-emerald-400">(recu)</span>}
                                        </td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-liquid-muted">{formatEuro(item.Revenue)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-white liquid-glass">
                                            {formatEuro(periodData.reduce((sum, item) => sum + item.Revenue, 0))}
                                        </td>
                                    </tr>
                                )}
                                {calculationMode === 'actual' && visibleCategories.revenue && (
                                    <tr className="border-b border-liquid bg-emerald-500/10">
                                        <td className="py-3 px-4 font-medium text-emerald-400 sticky left-0 bg-emerald-500/10 z-10">
                                            CA <span className="text-xs">(en attente)</span>
                                        </td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-emerald-400">
                                                {item.PendingRevenue > 0 ? formatEuro(item.PendingRevenue) : '-'}
                                            </td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-emerald-400 liquid-glass">
                                            {formatEuro(periodData.reduce((sum, item) => sum + (item.PendingRevenue || 0), 0))}
                                        </td>
                                    </tr>
                                )}
                                {visibleCategories.charges && (
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 font-medium text-red-400 sticky left-0 liquid-glass-strong z-10">Charges</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-red-400">-{formatEuro(item.Charges)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-red-400 liquid-glass">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.Charges, 0))}
                                        </td>
                                    </tr>
                                )}
                                {visibleCategories.fixed && (
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 font-medium text-orange-400 sticky left-0 liquid-glass-strong z-10">Frais fixes</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-orange-400">-{formatEuro(item.Fixed)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-orange-400 liquid-glass">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.Fixed, 0))}
                                        </td>
                                    </tr>
                                )}
                                {visibleCategories.oneshot && (
                                    <tr className="border-b border-liquid">
                                        <td className="py-3 px-4 font-medium text-purple-400 sticky left-0 liquid-glass-strong z-10">Frais ponctuels</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 text-purple-400">-{formatEuro(item.OneShot)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-semibold text-purple-400 liquid-glass">
                                            -{formatEuro(periodData.reduce((sum, item) => sum + item.OneShot, 0))}
                                        </td>
                                    </tr>
                                )}
                                {visibleCategories.net && (
                                    <tr className="border-t-2 border-liquid-strong">
                                        <td className="py-3 px-4 font-bold text-emerald-400 sticky left-0 liquid-glass-strong z-10">Net</td>
                                        {periodData.map((item, index) => (
                                            <td key={index} className="text-right py-3 px-4 font-bold text-emerald-400">{formatEuro(item.Net)}</td>
                                        ))}
                                        <td className="text-right py-3 px-4 font-bold text-emerald-400 liquid-glass">
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
