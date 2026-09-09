// Universal Navigation, Currency Switcher, Mobile Menu & Preloader Controller
// Designed for Mr.Artist Studio

export const USD_EXCHANGE_RATE = 305;
export let currentCurrency = 'LKR';

// 1. Initialize Currency
export function initCurrency() {
    try {
        const saved = localStorage.getItem('mrartist_currency');
        if (saved === 'LKR' || saved === 'USD') {
            currentCurrency = saved;
        } else {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            currentCurrency = tz.toLowerCase().includes('colombo') ? 'LKR' : 'USD';
        }
    } catch (e) {
        currentCurrency = 'LKR';
    }
    updateCurrencyButtons();
}

export function updateCurrencyButtons() {
    const btnLkr = document.getElementById('curr-btn-lkr');
    const btnUsd = document.getElementById('curr-btn-usd');
    if (!btnLkr || !btnUsd) return;

    if (currentCurrency === 'LKR') {
        btnLkr.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 bg-[#C85A32] text-white shadow-xs';
        btnUsd.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold text-[#666666] hover:text-[#222222] transition-all duration-200';
    } else {
        btnUsd.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 bg-[#C85A32] text-white shadow-xs';
        btnLkr.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold text-[#666666] hover:text-[#222222] transition-all duration-200';
    }
}

window.setCurrency = function(currency) {
    if (currency !== 'LKR' && currency !== 'USD') return;
    currentCurrency = currency;
    try {
        localStorage.setItem('mrartist_currency', currency);
    } catch (e) {}
    updateCurrencyButtons();
    // Dispatch event for pages that update dynamic prices (main.js, artworks.js, etc.)
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
};

let preloaderTimeout = null;

// 2. Universal Preloader Controller
export function dismissPreloader() {
    clearTimeout(preloaderTimeout);
    const preloader = document.getElementById('page-preloader');
    if (preloader && !preloader.classList.contains('loaded')) {
        preloader.classList.add('loaded');
        setTimeout(() => {
            if (preloader.parentNode && preloader.classList.contains('loaded')) {
                preloader.style.display = 'none';
            }
        }, 450);
    }
}

export function showPreloader() {
    const preloader = document.getElementById('page-preloader');
    if (preloader) {
        preloader.style.display = 'flex';
        preloader.classList.remove('loaded');
        clearTimeout(preloaderTimeout);
        preloaderTimeout = setTimeout(dismissPreloader, 2500);
    }
}

export function initPreloader() {
    if (document.readyState === 'complete') {
        setTimeout(dismissPreloader, 100);
    } else {
        window.addEventListener('load', () => {
            setTimeout(dismissPreloader, 100);
        });
        // Safety timeout so preloader never hangs on slow assets or bots
        setTimeout(dismissPreloader, 900);
    }

    // Handle bfcache (browser back/forward navigation)
    window.addEventListener('pageshow', () => {
        dismissPreloader();
    });

    // Attach smooth page loading transitions to internal navigation links
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href) return;

        // Ignore anchors, external protocols, downloads, or blank targets
        if (
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.includes('wa.me') ||
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            link.target === '_blank' ||
            link.hasAttribute('download')
        ) {
            return;
        }

        // Ignore clicks on links pointing to current page
        const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
        const targetPath = (link.pathname || '').replace(/\/$/, '') || '/';
        if (currentPath === targetPath && !link.search) {
            return;
        }

        showPreloader();
    });
}

// 3. Universal Mobile Menu Controller
window.toggleMobileMenu = function() {
    const dropdown = document.getElementById('mobile-menu-dropdown');
    const icon = document.getElementById('mobile-menu-icon');
    if (!dropdown) return;

    const isOpen = !dropdown.classList.contains('pointer-events-none');
    if (isOpen) {
        // Close
        dropdown.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
        dropdown.classList.remove('opacity-100', 'scale-100');
        if (icon) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    } else {
        // Open
        dropdown.classList.remove('pointer-events-none', 'opacity-0', 'scale-95');
        dropdown.classList.add('opacity-100', 'scale-100');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        }
    }
};

// Close mobile menu on outside click or Escape
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('mobile-menu-dropdown');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    if (!dropdown || dropdown.classList.contains('pointer-events-none')) return;

    if (!dropdown.contains(e.target) && !toggleBtn?.contains(e.target)) {
        window.toggleMobileMenu();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const dropdown = document.getElementById('mobile-menu-dropdown');
        if (dropdown && !dropdown.classList.contains('pointer-events-none')) {
            window.toggleMobileMenu();
        }
    }
});

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCurrency();
        initPreloader();
    });
} else {
    initCurrency();
    initPreloader();
}
