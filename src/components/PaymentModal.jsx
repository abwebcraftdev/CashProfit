import React, { useState, useEffect } from 'react';
import { X, Calendar, Repeat, FileText } from 'lucide-react';

const PaymentModal = ({
    isOpen,
    onClose,
    onSave,
    payment = null,
    serviceTotal = 0
}) => {
    const [formData, setFormData] = useState({
        type: 'deposit',
        percentage: 30,
        amount: null,
        usePercentage: true,
        dueDate: new Date().toISOString().split('T')[0],
        paidDate: null,
        status: 'pending',
        recurrence: {
            enabled: false,
            frequency: 'monthly',
            count: null
        },
        notes: ''
    });

    useEffect(() => {
        if (payment) {
            setFormData({
                type: payment.type || 'deposit',
                percentage: payment.percentage || 0,
                amount: payment.amount || null,
                usePercentage: payment.percentage !== null && payment.percentage !== undefined,
                dueDate: payment.dueDate || new Date().toISOString().split('T')[0],
                paidDate: payment.paidDate || null,
                status: payment.status || 'pending',
                recurrence: payment.recurrence || {
                    enabled: false,
                    frequency: 'monthly',
                    count: null
                },
                notes: payment.notes || ''
            });
        } else {
            setFormData({
                type: 'deposit',
                percentage: 30,
                amount: null,
                usePercentage: true,
                dueDate: new Date().toISOString().split('T')[0],
                paidDate: null,
                status: 'pending',
                recurrence: {
                    enabled: false,
                    frequency: 'monthly',
                    count: null
                },
                notes: ''
            });
        }
    }, [payment, isOpen]);

    if (!isOpen) return null;

    const calculatedAmount = formData.usePercentage
        ? (serviceTotal * (formData.percentage || 0) / 100)
        : (formData.amount || 0);

    const handleSubmit = () => {
        const paymentData = {
            id: payment?.id || Date.now(),
            type: formData.type,
            percentage: formData.usePercentage ? formData.percentage : null,
            amount: formData.usePercentage ? null : formData.amount,
            dueDate: formData.dueDate,
            paidDate: formData.paidDate,
            status: formData.status,
            recurrence: formData.recurrence,
            notes: formData.notes
        };
        onSave(paymentData);
        onClose();
    };

    const typeLabels = {
        full: 'Paiement total',
        deposit: 'Acompte',
        milestone: 'Jalon'
    };

    return (
        <div className="fixed inset-0 liquid-overlay flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <div className="liquid-glass-strong rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-white">
                        {payment ? 'Modifier le paiement' : 'Ajouter un paiement'}
                    </h3>
                    <button onClick={onClose} className="text-liquid-subtle hover:text-white transition cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Type de paiement */}
                    <div>
                        <label className="block text-xs font-medium text-liquid-muted mb-2">Type de paiement</label>
                        <div className="flex gap-2">
                            {['full', 'deposit', 'milestone'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                                        formData.type === type
                                            ? 'liquid-button-primary'
                                            : 'liquid-button'
                                    }`}
                                >
                                    {typeLabels[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Montant */}
                    <div className="liquid-glass rounded-xl p-4">
                        <label className="block text-xs font-medium text-liquid-muted mb-3">Montant</label>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.usePercentage}
                                    onChange={() => setFormData({ ...formData, usePercentage: true })}
                                    className="w-4 h-4 text-amber-500"
                                />
                                <span className="text-sm text-liquid-muted">Pourcentage:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.percentage || ''}
                                        onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0, usePercentage: true })}
                                        className="w-16 px-2 py-1 liquid-input rounded text-sm text-right"
                                        min="0"
                                        max="100"
                                    />
                                    <span className="text-sm text-liquid-subtle">%</span>
                                    <span className="text-sm text-liquid-subtle">=</span>
                                    <span className="text-sm font-medium text-liquid-primary">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(serviceTotal * (formData.percentage || 0) / 100)}
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!formData.usePercentage}
                                    onChange={() => setFormData({ ...formData, usePercentage: false })}
                                    className="w-4 h-4 text-amber-500"
                                />
                                <span className="text-sm text-liquid-muted">Montant fixe:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0, usePercentage: false })}
                                        className="w-24 px-2 py-1 liquid-input rounded text-sm text-right"
                                        min="0"
                                    />
                                    <span className="text-sm text-liquid-subtle">EUR</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Date d'echeance */}
                    <div>
                        <label className="block text-xs font-medium text-liquid-muted mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date d'echeance
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-3 py-2 liquid-input rounded-lg text-sm"
                        />
                    </div>

                    {/* Statut */}
                    <div>
                        <label className="block text-xs font-medium text-liquid-muted mb-2">Statut</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, status: 'pending', paidDate: null })}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                                    formData.status === 'pending'
                                        ? 'bg-amber-500/30 text-amber-300 border-2 border-amber-400/50'
                                        : 'liquid-button'
                                }`}
                            >
                                En attente
                            </button>
                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    status: 'received',
                                    paidDate: formData.paidDate || new Date().toISOString().split('T')[0]
                                })}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                                    formData.status === 'received'
                                        ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400/50'
                                        : 'liquid-button'
                                }`}
                            >
                                Recu
                            </button>
                        </div>
                    </div>

                    {/* Date de paiement (si recu) */}
                    {formData.status === 'received' && (
                        <div>
                            <label className="block text-xs font-medium text-liquid-muted mb-1">Date de reception</label>
                            <input
                                type="date"
                                value={formData.paidDate || ''}
                                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                                className="w-full px-3 py-2 liquid-input rounded-lg text-sm"
                            />
                        </div>
                    )}

                    {/* Recurrence */}
                    <div className="liquid-glass rounded-xl p-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={formData.recurrence.enabled}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    recurrence: { ...formData.recurrence, enabled: e.target.checked }
                                })}
                                className="w-4 h-4 rounded text-amber-500"
                            />
                            <Repeat className="w-4 h-4 text-liquid-subtle" />
                            <span className="text-sm font-medium text-white">Activer la recurrence</span>
                        </label>

                        {formData.recurrence.enabled && (
                            <div className="space-y-3 pl-6 border-l-2 border-amber-500/30">
                                <div>
                                    <label className="block text-xs text-liquid-subtle mb-1">Frequence</label>
                                    <select
                                        value={formData.recurrence.frequency}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            recurrence: { ...formData.recurrence, frequency: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 liquid-select rounded-lg text-sm"
                                    >
                                        <option value="monthly">Mensuel</option>
                                        <option value="quarterly">Trimestriel</option>
                                        <option value="yearly">Annuel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-liquid-subtle mb-1">
                                        Nombre d'occurrences <span className="text-liquid-subtle">(vide = illimite)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.recurrence.count || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            recurrence: {
                                                ...formData.recurrence,
                                                count: e.target.value ? parseInt(e.target.value) : null
                                            }
                                        })}
                                        className="w-full px-3 py-2 liquid-input rounded-lg text-sm"
                                        min="1"
                                        placeholder="Illimite"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-liquid-muted mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 liquid-input rounded-lg text-sm resize-none"
                            rows={2}
                            placeholder="Notes optionnelles..."
                        />
                    </div>

                    {/* Resume */}
                    <div className="liquid-glass-strong rounded-xl p-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-liquid-muted">Montant du paiement:</span>
                            <span className="font-bold text-liquid-primary text-glow-gold">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculatedAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 liquid-button rounded-xl font-medium cursor-pointer"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-2.5 px-4 liquid-button-primary rounded-xl font-medium cursor-pointer"
                        >
                            {payment ? 'Mettre a jour' : 'Ajouter'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
