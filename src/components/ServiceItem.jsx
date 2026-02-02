import React, { useState } from 'react';
import { Trash2, Settings, Calendar, Copy, ChevronDown, ChevronUp, Plus, X, CreditCard, Check, Clock } from 'lucide-react';
import clsx from 'clsx';
import PaymentModal from './PaymentModal';

export default function ServiceItem({
    service,
    onUpdate,
    onRemove,
    onDuplicate
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showCostModal, setShowCostModal] = useState(false);
    const [newCost, setNewCost] = useState({
        name: '',
        amount: '',
        frequency: 'mois',
        startDate: service.startDate || '',
        endDate: ''
    });

    const [editingCostId, setEditingCostId] = useState(null);

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);

    const handleAddCost = () => {
        if (!newCost.name || !newCost.amount) return;

        const currentCosts = service.params?.customFixedCosts || [];

        if (editingCostId) {
            // Update existing cost
            onUpdate('params', {
                ...service.params,
                customFixedCosts: currentCosts.map(c =>
                    c.id === editingCostId
                        ? { ...newCost, id: editingCostId, amount: parseFloat(newCost.amount) }
                        : c
                )
            });
        } else {
            // Add new cost
            const cost = {
                id: Date.now(),
                ...newCost,
                amount: parseFloat(newCost.amount)
            };
            onUpdate('params', {
                ...service.params,
                customFixedCosts: [...currentCosts, cost]
            });
        }

        setShowCostModal(false);
        setEditingCostId(null);
        setNewCost({
            name: '',
            amount: '',
            frequency: 'mois',
            startDate: service.startDate || '',
            endDate: ''
        });
    };

    const openAddModal = () => {
        setEditingCostId(null);
        setNewCost({
            name: '',
            amount: '',
            frequency: 'mois',
            startDate: service.startDate || '',
            endDate: ''
        });
        setShowCostModal(true);
    };

    const openEditModal = (cost) => {
        setEditingCostId(cost.id);
        setNewCost({
            name: cost.name,
            amount: cost.amount,
            frequency: cost.frequency,
            startDate: cost.startDate || '',
            endDate: cost.endDate || ''
        });
        setShowCostModal(true);
    };

    const removeCost = (costId) => {
        const currentCosts = service.params?.customFixedCosts || [];
        onUpdate('params', {
            ...service.params,
            customFixedCosts: currentCosts.filter(c => c.id !== costId)
        });
    };

    // Payment functions
    const handleAddPayment = (paymentData) => {
        const currentPayments = service.payments || [];
        const existingIndex = currentPayments.findIndex(p => p.id === paymentData.id);

        if (existingIndex >= 0) {
            // Update existing payment
            const updatedPayments = [...currentPayments];
            updatedPayments[existingIndex] = paymentData;
            onUpdate('payments', updatedPayments);
        } else {
            // Add new payment
            onUpdate('payments', [...currentPayments, paymentData]);
        }
        setEditingPayment(null);
    };

    const removePayment = (paymentId) => {
        const currentPayments = service.payments || [];
        onUpdate('payments', currentPayments.filter(p => p.id !== paymentId));
    };

    const togglePaymentStatus = (paymentId) => {
        const currentPayments = service.payments || [];
        const updatedPayments = currentPayments.map(p => {
            if (p.id === paymentId) {
                const newStatus = p.status === 'pending' ? 'received' : 'pending';
                return {
                    ...p,
                    status: newStatus,
                    paidDate: newStatus === 'received' ? new Date().toISOString().split('T')[0] : null
                };
            }
            return p;
        });
        onUpdate('payments', updatedPayments);
    };

    // Calculate service total for payments
    const serviceTotal = (parseFloat(service.price) || 0) * (parseInt(service.quantity) || 0);

    // Calculate payment totals
    const calculatePaymentAmount = (payment) => {
        if (payment.percentage !== null && payment.percentage !== undefined) {
            return serviceTotal * payment.percentage / 100;
        }
        return payment.amount || 0;
    };

    const totalPaymentsPlanned = (service.payments || []).reduce((sum, p) => sum + calculatePaymentAmount(p), 0);
    const totalPaymentsPercentage = serviceTotal > 0 ? (totalPaymentsPlanned / serviceTotal * 100) : 0;

    return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex items-center gap-3">
                {/* Main Info Row */}
                <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                    {/* Name - Takes more space */}
                    <div className="col-span-4">
                        <input
                            type="text"
                            placeholder="Nom du service"
                            value={service.name}
                            onChange={(e) => onUpdate('name', e.target.value)}
                            className="w-full px-2 py-1.5 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 bg-transparent font-medium text-slate-800 placeholder-slate-400 outline-none transition-colors"
                        />
                    </div>

                    {/* Price */}
                    <div className="col-span-2 relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">€</span>
                        <input
                            type="number"
                            placeholder="Prix"
                            value={service.price || ''}
                            onChange={(e) => onUpdate('price', e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded text-sm outline-none text-right font-mono"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 flex items-center gap-1">
                        <span className="text-xs text-slate-400">x</span>
                        <input
                            type="number"
                            placeholder="Qté"
                            value={service.quantity || ''}
                            onChange={(e) => onUpdate('quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded text-sm outline-none text-center font-mono"
                            min="0"
                        />
                    </div>

                    {/* Frequency */}
                    <div className="col-span-3">
                        <select
                            value={service.frequency}
                            onChange={(e) => onUpdate('frequency', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded text-xs outline-none cursor-pointer"
                        >
                            <option value="oneshot">One shot</option>
                            <option value="mois">Mois</option>
                            <option value="trimestre">Trimestre</option>
                            <option value="annee">Année</option>
                        </select>
                    </div>

                    {/* Toggle Advanced */}
                    <div className="col-span-1 flex justify-end">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={clsx(
                                "p-1.5 rounded-full transition-colors",
                                showAdvanced ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            )}
                            title="Paramètres avancés"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onDuplicate) onDuplicate();
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Dupliquer"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onRemove) onRemove();
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {(showAdvanced || service.frequency === 'oneshot' || service.startDate || service.endDate) && (
                <div className={clsx(
                    "mt-3 pt-3 border-t border-slate-100 grid gap-4 text-sm animate-in slide-in-from-top-2 duration-200",
                    showAdvanced ? "grid-cols-2" : "grid-cols-1"
                )}>

                    {/* Dates Section - Always visible if dates are set or oneshot */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Période
                        </p>

                        {service.frequency === 'oneshot' ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={service.startDate || ''}
                                    onChange={(e) => onUpdate('startDate', e.target.value)}
                                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:border-indigo-500 outline-none"
                                />
                                <span className="text-slate-400">→</span>
                                <input
                                    type="date"
                                    value={service.endDate || ''}
                                    onChange={(e) => onUpdate('endDate', e.target.value)}
                                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:border-indigo-500 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-xs w-12">Début:</span>
                                    <input
                                        type="date"
                                        value={service.startDate || ''}
                                        onChange={(e) => onUpdate('startDate', e.target.value)}
                                        className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 w-12">
                                        <input
                                            type="checkbox"
                                            checked={!!service.endDate}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const defaultEndDate = new Date();
                                                    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
                                                    onUpdate('endDate', defaultEndDate.toISOString().split('T')[0]);
                                                } else {
                                                    onUpdate('endDate', '');
                                                }
                                            }}
                                            className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-500 text-xs">Fin:</span>
                                    </div>
                                    {service.endDate ? (
                                        <input
                                            type="date"
                                            value={service.endDate || ''}
                                            onChange={(e) => onUpdate('endDate', e.target.value)}
                                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:border-indigo-500 outline-none"
                                        />
                                    ) : (
                                        <span className="text-slate-400 text-xs italic flex-1">Illimité</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Advanced Params Section - Only visible when expanded */}
                    {showAdvanced && (
                        <div className="space-y-3 border-l border-slate-100 pl-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Settings className="w-3 h-3" /> Configuration
                            </p>

                            {/* Charges */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-slate-600">Charges sociales</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={service.params?.socialChargesRate ?? 25}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 25;
                                                onUpdate('params', { ...service.params, socialChargesRate: val });
                                            }}
                                            className="w-12 px-1 py-0.5 border border-slate-200 rounded text-right text-xs"
                                        />
                                        <span className="text-xs text-slate-400">%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!!service.params?.reducedChargesEndDate}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const currentRate = service.params?.socialChargesRate ?? 25;
                                                onUpdate('params', {
                                                    ...service.params,
                                                    reducedChargesRate: currentRate,
                                                    reducedChargesEndDate: new Date().toISOString().split('T')[0]
                                                });
                                            } else {
                                                const { reducedChargesRate, reducedChargesEndDate, ...restParams } = service.params || {};
                                                onUpdate('params', restParams);
                                            }
                                        }}
                                        className="w-3 h-3 rounded text-indigo-600"
                                    />
                                    <span className="text-xs text-slate-600">ACRE / Taux réduit</span>
                                </div>

                                {service.params?.reducedChargesEndDate && (
                                    <div className="pl-4 space-y-1 border-l-2 border-indigo-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs text-slate-500">Taux réduit</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={service.params?.reducedChargesRate ?? 25}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 25;
                                                        onUpdate('params', { ...service.params, reducedChargesRate: val });
                                                    }}
                                                    className="w-12 px-1 py-0.5 border border-slate-200 rounded text-right text-xs"
                                                />
                                                <span className="text-xs text-slate-400">%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs text-slate-500">Jusqu'au</label>
                                            <input
                                                type="date"
                                                value={service.params.reducedChargesEndDate}
                                                onChange={(e) => {
                                                    onUpdate('params', { ...service.params, reducedChargesEndDate: e.target.value });
                                                }}
                                                className="w-24 px-1 py-0.5 border border-slate-200 rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payments Section */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" /> Paiements
                                    </label>
                                    <button
                                        onClick={() => {
                                            setEditingPayment(null);
                                            setShowPaymentModal(true);
                                        }}
                                        className="p-1 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                        title="Ajouter un paiement"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Payments List */}
                                {service.payments?.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                        {service.payments.map(payment => {
                                            const amount = calculatePaymentAmount(payment);
                                            const typeLabels = { full: 'Total', deposit: 'Acompte', milestone: 'Jalon' };
                                            const typeLabel = typeLabels[payment.type] || payment.type;
                                            const percentageText = payment.percentage ? ` ${payment.percentage}%` : '';

                                            return (
                                                <div
                                                    key={payment.id}
                                                    className={clsx(
                                                        "flex items-center justify-between text-xs p-1.5 rounded border group/payment cursor-pointer",
                                                        payment.status === 'received'
                                                            ? "bg-emerald-50 border-emerald-200"
                                                            : "bg-amber-50 border-amber-200"
                                                    )}
                                                    onClick={() => {
                                                        setEditingPayment(payment);
                                                        setShowPaymentModal(true);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                togglePaymentStatus(payment.id);
                                                            }}
                                                            className={clsx(
                                                                "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                                                payment.status === 'received'
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-amber-200 text-amber-600 hover:bg-amber-300"
                                                            )}
                                                            title={payment.status === 'received' ? 'Marquer en attente' : 'Marquer comme recu'}
                                                        >
                                                            {payment.status === 'received' ? (
                                                                <Check className="w-3 h-3" />
                                                            ) : (
                                                                <Clock className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-700">
                                                                {typeLabel}{percentageText}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
                                                                {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                                                                {payment.status === 'received' && payment.paidDate && (
                                                                    <span className="text-emerald-600 ml-1">
                                                                        (recu le {new Date(payment.paidDate).toLocaleDateString('fr-FR')})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={clsx(
                                                            "font-mono font-medium",
                                                            payment.status === 'received' ? "text-emerald-600" : "text-amber-600"
                                                        )}>
                                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removePayment(payment.id);
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover/payment:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Payment Summary */}
                                {service.payments?.length > 0 && (
                                    <div className={clsx(
                                        "text-[10px] p-1.5 rounded",
                                        totalPaymentsPercentage > 100
                                            ? "bg-red-50 text-red-600"
                                            : totalPaymentsPercentage < 100
                                                ? "bg-amber-50 text-amber-600"
                                                : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        Total planifie: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPaymentsPlanned)}
                                        {' '}({totalPaymentsPercentage.toFixed(0)}%)
                                        {totalPaymentsPercentage > 100 && ' - Attention: depasse 100%!'}
                                        {totalPaymentsPercentage < 100 && totalPaymentsPercentage > 0 && ' - Incomplet'}
                                    </div>
                                )}

                                {!service.payments?.length && (
                                    <p className="text-[10px] text-slate-400 italic">
                                        Aucun paiement planifie (revenu reparti sur la duree)
                                    </p>
                                )}
                            </div>

                            {/* Fixed Costs */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-600 block">Couts fixes mensuels</label>
                                    <button
                                        onClick={openAddModal}
                                        className="p-1 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                                        title="Ajouter un frais fixe"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1 text-slate-400 text-[10px]">Héb.</span>
                                        <input
                                            type="number"
                                            value={service.params?.hostingCost ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                onUpdate('params', { ...service.params, hostingCost: val });
                                            }}
                                            placeholder="0"
                                            className="w-full pl-8 pr-1 py-1 border border-slate-200 rounded text-xs text-right"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1 text-slate-400 text-[10px]">BDD</span>
                                        <input
                                            type="number"
                                            value={service.params?.databaseCost ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                onUpdate('params', { ...service.params, databaseCost: val });
                                            }}
                                            placeholder="0"
                                            className="w-full pl-8 pr-1 py-1 border border-slate-200 rounded text-xs text-right"
                                        />
                                    </div>
                                </div>

                                {/* Custom Fixed Costs List */}
                                {service.params?.customFixedCosts?.length > 0 && (
                                    <div className="space-y-1">
                                        {service.params.customFixedCosts.map(cost => (
                                            <div key={cost.id} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded border border-slate-100 group/cost">
                                                <div className="flex flex-col cursor-pointer flex-1" onClick={() => openEditModal(cost)}>
                                                    <span className="font-medium text-slate-700">{cost.name}</span>
                                                    <span className="text-[10px] text-slate-500">{cost.frequency}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-slate-600">{cost.amount}€</span>
                                                    <button
                                                        onClick={() => removeCost(cost.id)}
                                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover/cost:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for adding/editing custom cost */}
            {showCostModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingCostId ? 'Modifier le frais' : 'Ajouter un frais fixe'}
                            </h3>
                            <button onClick={() => setShowCostModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={newCost.name}
                                    onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: Licence logiciel"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Montant (€)</label>
                                    <input
                                        type="number"
                                        value={newCost.amount}
                                        onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Récurrence</label>
                                    <select
                                        value={newCost.frequency}
                                        onChange={(e) => setNewCost({ ...newCost, frequency: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="oneshot">Une fois</option>
                                        <option value="mois">Mensuel</option>
                                        <option value="trimestre">Trimestriel</option>
                                        <option value="annee">Annuel</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        value={newCost.startDate}
                                        onChange={(e) => setNewCost({ ...newCost, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-medium text-slate-700">Date de fin (optionnelle)</label>
                                        <span className="text-[10px] text-slate-400">Laisser vide si infini</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={newCost.endDate}
                                        onChange={(e) => setNewCost({ ...newCost, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddCost}
                                disabled={!newCost.name || !newCost.amount}
                                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {editingCostId ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setEditingPayment(null);
                }}
                onSave={handleAddPayment}
                payment={editingPayment}
                serviceTotal={serviceTotal}
            />
        </div>
    );
}
