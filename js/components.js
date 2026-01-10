// Page components for dynamically loaded subpages
// These must be defined BEFORE Alpine.start() and registered with Alpine.data()

// AuraHeat page component
function auraHeatPage() {
    return {
        mobileMenuOpen: false,
        activeVision: null,
        activeFlow: null,
        selectedSpec: 'M',
        buildingType: 'house',
        currentCost: 2500,

        // Calculated values
        gasTotal: 0,
        hpTotal: 0,
        auraTotal: 0,
        totalSavings: 0,
        maxCost: 50000,

        specs: {
            'S': { kw: '5 kW', modules: '5', target: 'Etagenwohnung (ca. 80m²)', invest: '< 6.000 €' },
            'M': { kw: '8 kW', modules: '8', target: 'Einfamilienhaus (ca. 150m²)', invest: '< 8.000 €' },
            'XL': { kw: '30 kW', modules: '30', target: 'Mehrfamilienhaus (ca. 400m²)', invest: 'Auf Anfrage' }
        },

        efficiencyData: [
            { label: '10°C', aura: 100, heatpump: 90 },
            { label: '5°C', aura: 100, heatpump: 80 },
            { label: '0°C', aura: 100, heatpump: 65 },
            { label: '-5°C', aura: 100, heatpump: 50 },
            { label: '-10°C', aura: 100, heatpump: 35 },
            { label: '-15°C', aura: 100, heatpump: 20 }
        ],

        init() {
            this.calculateSavings();
        },

        scrollTo(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },

        calculateSavings() {
            let installGas = 12000;
            let installHP = 25000;
            let installAura = 8000;

            if (this.buildingType === 'flat') {
                installGas = 8000;
                installHP = 18000;
                installAura = 5000;
            }
            if (this.buildingType === 'large') {
                installGas = 18000;
                installHP = 40000;
                installAura = 15000;
            }

            this.gasTotal = installGas + (parseInt(this.currentCost) * 10) + 2000;
            this.hpTotal = installHP + (parseInt(this.currentCost) * 0.7 * 10) + 1500;
            this.auraTotal = installAura;

            this.totalSavings = Math.max(this.gasTotal, this.hpTotal) - this.auraTotal;
            this.maxCost = Math.max(this.gasTotal, this.hpTotal) * 1.1;
        }
    };
}

// Tenstorrent page component
function tenstorrentPage() {
    return {
        mobileMenuOpen: false,

        readinessMetrics: [
            { label: 'Silicon Reliability', score: 'High', analysis: 'Hardware is stable, mass-produced, and functionally sound.' },
            { label: 'Driver Maturity', score: 'Low', analysis: 'Active development causing breaking changes weekly.' },
            { label: 'Eco-system (Metal)', score: 'Medium', analysis: 'TT-Metalium is powerful but has a steep learning curve.' },
            { label: 'Cost Efficiency', score: 'High', analysis: 'Unbeatable $/FLOP at the hardware level.' }
        ],

        scrollTo(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };
}

// Make functions globally available for x-data="functionName()" syntax
window.auraHeatPage = auraHeatPage;
window.tenstorrentPage = tenstorrentPage;

// Register with Alpine.data() when Alpine is available
document.addEventListener('alpine:init', () => {
    Alpine.data('auraHeatPage', auraHeatPage);
    Alpine.data('tenstorrentPage', tenstorrentPage);
    console.log('[components.js] Alpine components registered');
});
