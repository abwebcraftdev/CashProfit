import { differenceInDays, getYear, isValid, parseISO, eachYearOfInterval, startOfYear, endOfYear, max, min, startOfMonth, endOfMonth, getMonth, isBefore, isAfter, addMonths, addQuarters, addYears } from 'date-fns';

// Constante globale pour l'année de départ
export const START_YEAR = 2025;

// Helper function to get the social charges rate for a service at a specific date
export const getSocialChargesRate = (service, targetDate) => {
    const defaultRate = 25; // Par défaut 25%
    const serviceRate = service.params?.socialChargesRate ?? defaultRate;

    // Si pas de charges réduites, retourner le taux du service
    if (!service.params?.reducedChargesEndDate) {
        return serviceRate;
    }

    // Vérifier si on est dans la période de charges réduites
    const reducedEndDate = parseISO(service.params.reducedChargesEndDate);
    const reducedRate = service.params?.reducedChargesRate ?? defaultRate;

    if (isValid(reducedEndDate)) {
        // Si la date cible est avant ou égale à la date de fin des charges réduites
        if (isBefore(targetDate, reducedEndDate) || targetDate.getTime() === reducedEndDate.getTime()) {
            return reducedRate;
        }
    }

    // Après la date de fin, retourner le taux par défaut (25%)
    return defaultRate;
};

// Helper function to calculate fixed costs for a service for a specific month/year
// Takes into account the service start date and end date
export const calculateServiceFixedCosts = (service, year, month) => {
    const serviceStartDate = service.startDate ? parseISO(service.startDate) : null;
    const serviceEndDate = service.endDate ? parseISO(service.endDate) : null;
    const targetDate = new Date(year, month, 1);
    const monthEnd = endOfMonth(targetDate);

    // Base fixed costs (Hosting, Database, Domains)
    let hosting = 0;
    let database = 0;
    let domains = 0;
    let customRecurring = 0;
    let customOneShot = 0;

    // Check if main service is active
    const isServiceActive = (!serviceStartDate || !isBefore(targetDate, startOfMonth(serviceStartDate))) &&
        (!serviceEndDate || !isAfter(targetDate, endOfMonth(serviceEndDate)));

    if (isServiceActive) {
        hosting = service.params?.hostingCost || 0;
        database = service.params?.databaseCost || 0;
        const domainPrice = service.params?.domainPrice || 0;
        const domainCount = service.params?.domainCount || 0;
        domains = (domainPrice * domainCount) / 12;
    }

    // Calculate custom fixed costs
    if (service.params?.customFixedCosts && Array.isArray(service.params.customFixedCosts)) {
        service.params.customFixedCosts.forEach(cost => {
            const costAmount = parseFloat(cost.amount) || 0;
            const costStartDate = cost.startDate ? parseISO(cost.startDate) : (serviceStartDate || null); // Default to service start if not set
            const costEndDate = cost.endDate ? parseISO(cost.endDate) : null;

            // Check if this specific cost is active in this month
            // If cost has its own start date, use it. Otherwise fall back to service start date.
            // If cost has its own end date, use it. Otherwise it's infinite (unless service ends? usually fixed costs might continue or stop with service)
            // Let's assume custom costs are independent but default to service bounds if not specified? 
            // The requirement says: "date de debut (par default identique a la date de debut du service) date de fin (case cliquable) sinon infini"

            const effectiveStartDate = costStartDate;

            // Check start date
            if (effectiveStartDate && isBefore(targetDate, startOfMonth(effectiveStartDate))) {
                return;
            }

            // Check end date
            if (costEndDate && isAfter(targetDate, endOfMonth(costEndDate))) {
                return;
            }

            // Calculate amount based on frequency
            switch (cost.frequency) {
                case 'mois':
                    customRecurring += costAmount;
                    break;
                case 'trimestre':
                    // Cash flow view: Charge full amount every 3 months
                    // We need to know the start month of the cost to determine the cycle
                    if (effectiveStartDate) {
                        const startMonthIndex = getMonth(effectiveStartDate);
                        // Calculate months difference from start
                        // We need to handle year boundaries. 
                        // Actually, we just need to check if (currentMonth - startMonth) % 3 === 0
                        // But we need to account for years passed if we want to be precise, 
                        // although usually "quarterly" implies Jan, Apr, Jul, Oct or based on start date?
                        // Let's base it on the start date.

                        // Calculate total months difference
                        const diffMonths = (year - getYear(effectiveStartDate)) * 12 + (month - startMonthIndex);

                        if (diffMonths >= 0 && diffMonths % 3 === 0) {
                            customRecurring += costAmount;
                        }
                    } else {
                        // If no start date, assume starting Jan? Or service start?
                        // effectiveStartDate defaults to serviceStartDate or null.
                        // If null, we can't really determine cycle. Assume monthly? Or just every 3 months starting Jan?
                        // Let's assume Jan start if absolutely no date.
                        if (month % 3 === 0) {
                            customRecurring += costAmount;
                        }
                    }
                    break;
                case 'annee':
                    // Cash flow view: Charge full amount once a year
                    if (effectiveStartDate) {
                        const startMonthIndex = getMonth(effectiveStartDate);
                        if (month === startMonthIndex) {
                            customRecurring += costAmount;
                        }
                    } else {
                        // Default to January if no date
                        if (month === 0) {
                            customRecurring += costAmount;
                        }
                    }
                    break;
                case 'oneshot':
                    // One shot costs - similar logic to one shot service revenues
                    if (!effectiveStartDate) {
                        // If no start date, skip
                        break;
                    }

                    // If only start date (no end date), apply on start date month
                    if (!costEndDate) {
                        if (getMonth(effectiveStartDate) === month && getYear(effectiveStartDate) === year) {
                            customOneShot += costAmount;
                        }
                    } else {
                        // If both start and end dates, distribute proportionally across months
                        const start = effectiveStartDate;
                        const end = costEndDate;

                        if (!isValid(start) || !isValid(end) || end < start) {
                            break;
                        }

                        const monthStart = startOfMonth(targetDate);
                        const monthEnd = endOfMonth(targetDate);

                        // Calculate overlap between cost period and this month
                        const overlapStart = max([start, monthStart]);
                        const overlapEnd = min([end, monthEnd]);

                        if (overlapStart > overlapEnd) {
                            break;
                        }

                        // Calculate proportional amount based on days
                        const totalDurationDays = differenceInDays(end, start) + 1;
                        const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;

                        if (totalDurationDays > 0) {
                            customOneShot += (costAmount / totalDurationDays) * overlapDays;
                        }
                    }
                    break;
                default:
                    break;
            }
        });
    }

    return {
        hosting,
        database,
        domains,
        customRecurring,
        customOneShot
    };
};

export const calculateServiceRevenue = (service, year, month = null) => {
    const price = parseFloat(service.price) || 0;
    const quantity = parseInt(service.quantity) || 0;
    const totalAmount = price * quantity;

    if (service.frequency === 'oneshot') {
        if (!service.startDate || !service.endDate) {
            return 0;
        }

        const start = parseISO(service.startDate);
        const end = parseISO(service.endDate);

        if (!isValid(start) || !isValid(end) || end < start) return 0;

        if (month !== null) {
            // Calculate for a specific month
            const monthStart = startOfMonth(new Date(year, month, 1));
            const monthEnd = endOfMonth(new Date(year, month, 1));

            const overlapStart = max([start, monthStart]);
            const overlapEnd = min([end, monthEnd]);

            if (overlapStart > overlapEnd) return 0;

            const totalDurationDays = differenceInDays(end, start) + 1;
            const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;

            return (totalAmount / totalDurationDays) * overlapDays;
        } else {
            // Calculate for a year
            const totalDurationDays = differenceInDays(end, start) + 1;
            if (totalDurationDays <= 0) return 0;

            const yearStart = startOfYear(new Date(year, 0, 1));
            const yearEnd = endOfYear(new Date(year, 0, 1));

            const overlapStart = max([start, yearStart]);
            const overlapEnd = min([end, yearEnd]);

            if (overlapStart > overlapEnd) return 0;

            const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;

            return (totalAmount / totalDurationDays) * overlapDays;
        }
    } else {
        // Recurring services
        const serviceStartDate = service.startDate ? parseISO(service.startDate) : null;
        const serviceEndDate = service.endDate ? parseISO(service.endDate) : null;

        if (month !== null) {
            // Calculate for a specific month
            const targetDate = new Date(year, month, 1);
            const monthStart = startOfMonth(targetDate);
            const monthEnd = endOfMonth(targetDate);

            // If service hasn't started yet, return 0
            if (serviceStartDate && isBefore(monthStart, startOfMonth(serviceStartDate))) {
                return 0;
            }

            // If service has ended before this month starts, return 0
            if (serviceEndDate && isBefore(endOfMonth(serviceEndDate), monthStart)) {
                return 0;
            }

            // If service ends during this month, we still count the full month amount
            // (the service was active for at least part of the month)

            let monthlyAmount = 0;
            switch (service.frequency) {
                case 'mois':
                    monthlyAmount = totalAmount;
                    break;
                case 'trimestre':
                    monthlyAmount = totalAmount / 3;
                    break;
                case 'annee':
                    monthlyAmount = totalAmount / 12;
                    break;
                default:
                    monthlyAmount = 0;
            }
            return monthlyAmount;
        } else {
            // Calculate for a year
            const yearStart = startOfYear(new Date(year, 0, 1));
            const yearEnd = endOfYear(new Date(year, 0, 1));

            // If service has ended before this year, return 0
            if (serviceEndDate && isBefore(serviceEndDate, yearStart)) {
                return 0;
            }

            // If service starts after this year, return 0
            if (serviceStartDate && isAfter(serviceStartDate, yearEnd)) {
                return 0;
            }

            // Calculate the effective start and end dates for this year
            const effectiveStart = serviceStartDate ? max([serviceStartDate, yearStart]) : yearStart;
            const effectiveEnd = serviceEndDate ? min([serviceEndDate, yearEnd]) : yearEnd;

            // If effective end is before effective start, return 0
            if (isAfter(effectiveStart, effectiveEnd)) {
                return 0;
            }

            // Calculate the number of months active in this year
            const startMonth = getMonth(effectiveStart);
            const endMonth = getMonth(effectiveEnd);
            const monthsActive = endMonth - startMonth + 1;
            const proportion = monthsActive / 12;

            let annualAmount = 0;
            switch (service.frequency) {
                case 'mois':
                    annualAmount = totalAmount * monthsActive;
                    break;
                case 'trimestre':
                    // Calculate number of complete quarters active in this year
                    // Each quarter is 3 months, so we count how many complete 3-month periods
                    const quartersActive = Math.ceil(monthsActive / 3);
                    annualAmount = totalAmount * quartersActive;
                    break;
                case 'annee':
                    // For annual frequency, if active for part of the year, calculate proportion
                    annualAmount = totalAmount * proportion;
                    break;
                default:
                    annualAmount = 0;
            }
            return annualAmount;
        }
    }
};

export const calculateSimulationTotals = (simulation, yearsToProject = 5) => {
    const currentYear = new Date().getFullYear();
    // Générer les années de START_YEAR jusqu'à currentYear + yearsToProject
    const years = Array.from(
        { length: currentYear - START_YEAR + yearsToProject },
        (_, i) => START_YEAR + i
    );

    const projection = years.map(year => {
        let revenue = 0;

        simulation.services.forEach(service => {
            revenue += calculateServiceRevenue(service, year);
        });

        // Global params or service overrides
        // Requirement: "chaque entrée de service peut avoir ses propres parametres globaux"
        // This implies we need to calculate costs PER SERVICE if overridden, or use global if not.
        // But wait, fixed costs (hosting, domains) are usually global?
        // Or does the user mean "Charges sociales" can be overridden per service? 
        // "Database cost" is global.

        // Calculate costs per service
        // Social charges are calculated per service with reduced charges support
        let socialCharges = 0;
        let annualHosting = 0;
        let annualDomains = 0;
        let annualDatabase = 0;
        let annualCustomRecurring = 0;
        let annualCustomOneShot = 0;

        simulation.services.forEach(service => {
            const serviceRev = calculateServiceRevenue(service, year);

            // Calculate charges for each month of the year to handle reduced charges properly
            let yearCharges = 0;
            for (let m = 0; m < 12; m++) {
                const monthDate = new Date(year, m, 1);
                const monthRev = calculateServiceRevenue(service, year, m);
                const rate = getSocialChargesRate(service, monthDate);
                yearCharges += monthRev * (rate / 100);
            }
            socialCharges += yearCharges;

            // Fixed costs per service (Annual) - calculated month by month to account for start dates
            for (let m = 0; m < 12; m++) {
                const fixedCosts = calculateServiceFixedCosts(service, year, m);
                annualHosting += fixedCosts.hosting;
                annualDatabase += fixedCosts.database;
                annualDomains += fixedCosts.domains;
                annualCustomRecurring += fixedCosts.customRecurring;
                annualCustomOneShot += fixedCosts.customOneShot;
            }
        });

        const fixedCosts = annualHosting + annualDomains + annualDatabase + annualCustomRecurring;
        const oneShotCosts = annualCustomOneShot;

        return {
            year,
            revenue,
            charges: socialCharges,
            fixedCosts,
            oneShotCosts,
            net: revenue - socialCharges - fixedCosts - oneShotCosts
        };
    });

    return projection;
};

export const aggregateDashboardData = (simulations, yearsToProject = 5) => {
    const activeSims = simulations.filter(s => !s.isTest);
    if (activeSims.length === 0) return [];

    const currentYear = new Date().getFullYear();
    // Générer les années de START_YEAR jusqu'à currentYear + yearsToProject
    const years = Array.from(
        { length: currentYear - START_YEAR + yearsToProject },
        (_, i) => START_YEAR + i
    );

    return years.map(year => {
        let totalRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;
        let totalNet = 0;

        activeSims.forEach(sim => {
            const totals = calculateSimulationTotals(sim, yearsToProject).find(p => p.year === year);
            if (totals) {
                totalRevenue += totals.revenue;
                totalCharges += totals.charges;
                totalFixed += totals.fixedCosts;
                totalOneShot += totals.oneShotCosts;
                totalNet += totals.net;
            }
        });

        return {
            year,
            Revenue: totalRevenue,
            Charges: totalCharges,
            Fixed: totalFixed,
            OneShot: totalOneShot,
            Net: totalNet
        };
    });
};

export const aggregateMonthlyData = (simulations, year) => {
    const activeSims = simulations.filter(s => !s.isTest);
    if (activeSims.length === 0) return [];

    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return months.map(month => {
        let totalRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;
        let totalNet = 0;

        activeSims.forEach(sim => {
            // Calculate revenue for this month
            let monthRevenue = 0;
            sim.services.forEach(service => {
                monthRevenue += calculateServiceRevenue(service, year, month);
            });

            // Calculate charges for this month
            let monthCharges = 0;
            sim.services.forEach(service => {
                const serviceRev = calculateServiceRevenue(service, year, month);
                const monthDate = new Date(year, month, 1);
                const rate = getSocialChargesRate(service, monthDate);
                monthCharges += serviceRev * (rate / 100);
            });

            // Fixed costs (monthly) - aggregated from all services, taking into account service start date
            let monthlyHosting = 0;
            let monthlyDomains = 0;
            let monthlyDatabase = 0;
            let monthlyCustomRecurring = 0;
            let monthlyCustomOneShot = 0;

            sim.services.forEach(service => {
                const fixedCosts = calculateServiceFixedCosts(service, year, month);
                monthlyHosting += fixedCosts.hosting;
                monthlyDatabase += fixedCosts.database;
                monthlyDomains += fixedCosts.domains;
                monthlyCustomRecurring += fixedCosts.customRecurring;
                monthlyCustomOneShot += fixedCosts.customOneShot;
            });

            const monthFixed = monthlyHosting + monthlyDomains + monthlyDatabase + monthlyCustomRecurring;
            const monthOneShot = monthlyCustomOneShot;

            totalRevenue += monthRevenue;
            totalCharges += monthCharges;
            totalFixed += monthFixed;
            totalOneShot += monthOneShot;
            totalNet += monthRevenue - monthCharges - monthFixed - monthOneShot;
        });

        return {
            month: monthNames[month],
            monthIndex: month,
            Revenue: totalRevenue,
            Charges: totalCharges,
            Fixed: totalFixed,
            OneShot: totalOneShot,
            Net: totalNet
        };
    });
};

export const aggregateQuarterlyData = (simulations, year) => {
    const activeSims = simulations.filter(s => !s.isTest);
    if (activeSims.length === 0) return [];

    const quarters = [
        { name: 'T1', months: [0, 1, 2] },
        { name: 'T2', months: [3, 4, 5] },
        { name: 'T3', months: [6, 7, 8] },
        { name: 'T4', months: [9, 10, 11] }
    ];

    return quarters.map(quarter => {
        let totalRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;
        let totalNet = 0;

        // Aggregate data for all months in this quarter
        quarter.months.forEach(month => {
            activeSims.forEach(sim => {
                // Calculate revenue for this month
                let monthRevenue = 0;
                sim.services.forEach(service => {
                    monthRevenue += calculateServiceRevenue(service, year, month);
                });

                // Calculate charges for this month
                let monthCharges = 0;
                sim.services.forEach(service => {
                    const serviceRev = calculateServiceRevenue(service, year, month);
                    const monthDate = new Date(year, month, 1);
                    const rate = getSocialChargesRate(service, monthDate);
                    monthCharges += serviceRev * (rate / 100);
                });

                // Fixed costs (monthly) - aggregated from all services, taking into account service start date
                let monthlyHosting = 0;
                let monthlyDomains = 0;
                let monthlyDatabase = 0;
                let monthlyCustomRecurring = 0;
                let monthlyCustomOneShot = 0;

                sim.services.forEach(service => {
                    const fixedCosts = calculateServiceFixedCosts(service, year, month);
                    monthlyHosting += fixedCosts.hosting;
                    monthlyDatabase += fixedCosts.database;
                    monthlyDomains += fixedCosts.domains;
                    monthlyCustomRecurring += fixedCosts.customRecurring;
                    monthlyCustomOneShot += fixedCosts.customOneShot;
                });

                const monthFixed = monthlyHosting + monthlyDomains + monthlyDatabase + monthlyCustomRecurring;
                const monthOneShot = monthlyCustomOneShot;

                totalRevenue += monthRevenue;
                totalCharges += monthCharges;
                totalFixed += monthFixed;
                totalOneShot += monthOneShot;
                totalNet += monthRevenue - monthCharges - monthFixed - monthOneShot;
            });
        });

        return {
            period: quarter.name,
            Revenue: totalRevenue,
            Charges: totalCharges,
            Fixed: totalFixed,
            OneShot: totalOneShot,
            Net: totalNet
        };
    });
};

export const aggregateYearlyData = (simulations, year) => {
    const activeSims = simulations.filter(s => !s.isTest);
    if (activeSims.length === 0) return [];

    let totalRevenue = 0;
    let totalCharges = 0;
    let totalFixed = 0;
    let totalOneShot = 0;
    let totalNet = 0;

    activeSims.forEach(sim => {
        // Calculate revenue for the year
        let yearRevenue = 0;
        sim.services.forEach(service => {
            yearRevenue += calculateServiceRevenue(service, year);
        });

        // Calculate charges for the year - need to calculate per month to handle reduced charges
        let yearCharges = 0;
        for (let m = 0; m < 12; m++) {
            sim.services.forEach(service => {
                const monthRev = calculateServiceRevenue(service, year, m);
                const monthDate = new Date(year, m, 1);
                const rate = getSocialChargesRate(service, monthDate);
                yearCharges += monthRev * (rate / 100);
            });
        }

        // Fixed costs (annual) - aggregated from all services, calculated month by month to account for start dates
        let annualHosting = 0;
        let annualDomains = 0;
        let annualDatabase = 0;
        let annualCustomRecurring = 0;
        let annualCustomOneShot = 0;

        for (let m = 0; m < 12; m++) {
            sim.services.forEach(service => {
                const fixedCosts = calculateServiceFixedCosts(service, year, m);
                annualHosting += fixedCosts.hosting;
                annualDatabase += fixedCosts.database;
                annualDomains += fixedCosts.domains;
                annualCustomRecurring += fixedCosts.customRecurring;
                annualCustomOneShot += fixedCosts.customOneShot;
            });
        }

        const yearFixed = annualHosting + annualDomains + annualDatabase + annualCustomRecurring;
        const yearOneShot = annualCustomOneShot;

        totalRevenue += yearRevenue;
        totalCharges += yearCharges;
        totalFixed += yearFixed;
        totalOneShot += yearOneShot;
        totalNet += yearRevenue - yearCharges - yearFixed - yearOneShot;
    });

    return [{
        period: year.toString(),
        Revenue: totalRevenue,
        Charges: totalCharges,
        Fixed: totalFixed,
        OneShot: totalOneShot,
        Net: totalNet
    }];
};

// =====================================================
// NOUVELLES FONCTIONS POUR LE MODE COMPTABLE (URSSAF)
// =====================================================

// Helper: Calculate payment amount from percentage or fixed amount
const calculatePaymentAmount = (payment, serviceTotal) => {
    if (payment.percentage !== null && payment.percentage !== undefined) {
        return serviceTotal * payment.percentage / 100;
    }
    return payment.amount || 0;
};

// Helper: Generate recurring payment instances based on recurrence settings
const generateRecurringPayments = (payment, serviceTotal, maxDate = null) => {
    if (!payment.recurrence?.enabled) {
        return [payment];
    }

    const payments = [];
    const baseDate = parseISO(payment.dueDate);
    const maxIterations = payment.recurrence.count || 60; // Max 5 years monthly if no count specified
    const maxDateLimit = maxDate || new Date(new Date().getFullYear() + 5, 11, 31);

    for (let i = 0; i < maxIterations; i++) {
        let nextDate;
        switch (payment.recurrence.frequency) {
            case 'monthly':
                nextDate = addMonths(baseDate, i);
                break;
            case 'quarterly':
                nextDate = addQuarters(baseDate, i);
                break;
            case 'yearly':
                nextDate = addYears(baseDate, i);
                break;
            default:
                nextDate = addMonths(baseDate, i);
        }

        if (isAfter(nextDate, maxDateLimit)) break;

        payments.push({
            ...payment,
            id: `${payment.id}_${i}`,
            dueDate: nextDate.toISOString().split('T')[0],
            paidDate: i === 0 ? payment.paidDate : null,
            status: i === 0 ? payment.status : 'pending'
        });
    }

    return payments;
};

// Calculate revenue for a service in actual/accounting mode for a specific month
export const calculateActualPaymentRevenue = (service, year, month) => {
    // If no payments defined, fallback to distributed calculation
    if (!service.payments || service.payments.length === 0) {
        return {
            received: calculateServiceRevenue(service, year, month),
            pending: 0
        };
    }

    const serviceTotal = (parseFloat(service.price) || 0) * (parseInt(service.quantity) || 0);
    let receivedRevenue = 0;
    let pendingRevenue = 0;

    service.payments.forEach(payment => {
        // Generate all instances for recurring payments
        const paymentInstances = generateRecurringPayments(payment, serviceTotal);

        paymentInstances.forEach(p => {
            const paymentAmount = calculatePaymentAmount(p, serviceTotal);

            // Determine which date to use based on status
            const relevantDate = p.status === 'received' && p.paidDate
                ? parseISO(p.paidDate)
                : parseISO(p.dueDate);

            if (!isValid(relevantDate)) return;

            if (getYear(relevantDate) === year && getMonth(relevantDate) === month) {
                if (p.status === 'received') {
                    receivedRevenue += paymentAmount;
                } else {
                    pendingRevenue += paymentAmount;
                }
            }
        });
    });

    return {
        received: receivedRevenue,
        pending: pendingRevenue
    };
};

// Calculate pending revenue for a service for a specific month
export const calculatePendingRevenue = (service, year, month) => {
    if (!service.payments || service.payments.length === 0) return 0;

    const serviceTotal = (parseFloat(service.price) || 0) * (parseInt(service.quantity) || 0);
    let pending = 0;

    service.payments
        .filter(p => p.status === 'pending')
        .forEach(payment => {
            const paymentInstances = generateRecurringPayments(payment, serviceTotal);

            paymentInstances.forEach(p => {
                const dueDate = parseISO(p.dueDate);
                if (!isValid(dueDate)) return;

                if (getYear(dueDate) === year && getMonth(dueDate) === month) {
                    pending += calculatePaymentAmount(p, serviceTotal);
                }
            });
        });

    return pending;
};

// Aggregate monthly data with accounting mode support
export const aggregateMonthlyDataWithMode = (simulations, year, mode = 'distributed') => {
    const activeSims = simulations.filter(s => !s.isTest);
    if (activeSims.length === 0) return [];

    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map(month => {
        let totalRevenue = 0;
        let totalPendingRevenue = 0;
        let totalCharges = 0;
        let totalFixed = 0;
        let totalOneShot = 0;
        let totalNet = 0;

        activeSims.forEach(sim => {
            let monthRevenue = 0;
            let monthPending = 0;

            sim.services.forEach(service => {
                if (mode === 'actual') {
                    // Use accounting mode: revenue based on payment dates
                    const paymentRevenue = calculateActualPaymentRevenue(service, year, month);
                    monthRevenue += paymentRevenue.received;
                    monthPending += paymentRevenue.pending;
                } else {
                    // Use distributed mode: revenue spread over service duration
                    monthRevenue += calculateServiceRevenue(service, year, month);
                }
            });

            // Calculate charges for this month
            let monthCharges = 0;
            sim.services.forEach(service => {
                // In accounting mode, charges are based on received revenue only
                const revenueForCharges = mode === 'actual'
                    ? calculateActualPaymentRevenue(service, year, month).received
                    : calculateServiceRevenue(service, year, month);

                const monthDate = new Date(year, month, 1);
                const rate = getSocialChargesRate(service, monthDate);
                monthCharges += revenueForCharges * (rate / 100);
            });

            // Fixed costs
            let monthlyHosting = 0;
            let monthlyDomains = 0;
            let monthlyDatabase = 0;
            let monthlyCustomRecurring = 0;
            let monthlyCustomOneShot = 0;

            sim.services.forEach(service => {
                const fixedCosts = calculateServiceFixedCosts(service, year, month);
                monthlyHosting += fixedCosts.hosting;
                monthlyDatabase += fixedCosts.database;
                monthlyDomains += fixedCosts.domains;
                monthlyCustomRecurring += fixedCosts.customRecurring;
                monthlyCustomOneShot += fixedCosts.customOneShot;
            });

            const monthFixed = monthlyHosting + monthlyDomains + monthlyDatabase + monthlyCustomRecurring;
            const monthOneShot = monthlyCustomOneShot;

            totalRevenue += monthRevenue;
            totalPendingRevenue += monthPending;
            totalCharges += monthCharges;
            totalFixed += monthFixed;
            totalOneShot += monthOneShot;
            totalNet += monthRevenue - monthCharges - monthFixed - monthOneShot;
        });

        return {
            month: monthNames[month],
            monthIndex: month,
            Revenue: totalRevenue,
            PendingRevenue: totalPendingRevenue,
            Charges: totalCharges,
            Fixed: totalFixed,
            OneShot: totalOneShot,
            Net: totalNet
        };
    });
};

// Aggregate quarterly data with accounting mode support
export const aggregateQuarterlyDataWithMode = (simulations, year, mode = 'distributed') => {
    const monthlyData = aggregateMonthlyDataWithMode(simulations, year, mode);

    // If no monthly data, return empty quarters
    if (!monthlyData || monthlyData.length === 0) {
        return [
            { period: 'T1', Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 },
            { period: 'T2', Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 },
            { period: 'T3', Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 },
            { period: 'T4', Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 }
        ];
    }

    const quarters = [
        { name: 'T1', months: [0, 1, 2] },
        { name: 'T2', months: [3, 4, 5] },
        { name: 'T3', months: [6, 7, 8] },
        { name: 'T4', months: [9, 10, 11] }
    ];

    return quarters.map(quarter => {
        const quarterData = quarter.months.reduce((acc, monthIndex) => {
            const monthData = monthlyData[monthIndex];
            if (!monthData) return acc;
            return {
                Revenue: acc.Revenue + (monthData.Revenue || 0),
                PendingRevenue: acc.PendingRevenue + (monthData.PendingRevenue || 0),
                Charges: acc.Charges + (monthData.Charges || 0),
                Fixed: acc.Fixed + (monthData.Fixed || 0),
                OneShot: acc.OneShot + (monthData.OneShot || 0),
                Net: acc.Net + (monthData.Net || 0)
            };
        }, { Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 });

        return {
            period: quarter.name,
            ...quarterData
        };
    });
};

// Aggregate yearly data with accounting mode support
export const aggregateYearlyDataWithMode = (simulations, year, mode = 'distributed') => {
    const monthlyData = aggregateMonthlyDataWithMode(simulations, year, mode);

    // If no monthly data, return empty year
    if (!monthlyData || monthlyData.length === 0) {
        return [{
            period: year.toString(),
            Revenue: 0,
            PendingRevenue: 0,
            Charges: 0,
            Fixed: 0,
            OneShot: 0,
            Net: 0
        }];
    }

    const yearData = monthlyData.reduce((acc, monthData) => {
        if (!monthData) return acc;
        return {
            Revenue: acc.Revenue + (monthData.Revenue || 0),
            PendingRevenue: acc.PendingRevenue + (monthData.PendingRevenue || 0),
            Charges: acc.Charges + (monthData.Charges || 0),
            Fixed: acc.Fixed + (monthData.Fixed || 0),
            OneShot: acc.OneShot + (monthData.OneShot || 0),
            Net: acc.Net + (monthData.Net || 0)
        };
    }, { Revenue: 0, PendingRevenue: 0, Charges: 0, Fixed: 0, OneShot: 0, Net: 0 });

    return [{
        period: year.toString(),
        ...yearData
    }];
};
