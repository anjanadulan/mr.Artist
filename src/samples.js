import { initAdBlockDetector } from './adblock.js';
initAdBlockDetector();
import './style.css';
import { fetchSamples, defaultSamples } from './supabase.js';

// ----------------- Multi-Currency Conversion Engine -----------------
export let currentCurrency = 'LKR'; // 'LKR' | 'USD'
export const USD_EXCHANGE_RATE = 305; // 1 USD ≈ 305 LKR

export function formatPrice(lkrAmount, options = {}) {
    let num = 0;
    if (typeof lkrAmount === 'number') {
        num = lkrAmount;
    } else if (typeof lkrAmount === 'string') {
        num = parseFloat(lkrAmount.replace(/[^0-9.]/g, '')) || 0;
    }
    
    if (currentCurrency === 'USD') {
        const usdVal = num / USD_EXCHANGE_RATE;
        const formatted = '$' + usdVal.toFixed(2);
        if (options.prefix) return options.prefix + formatted + (options.suffix || '');
        return formatted;
    } else {
        const formatted = 'LKR ' + num.toLocaleString();
        if (options.prefix) return options.prefix + formatted + (options.suffix || '');
        return formatted;
    }
}

export function detectUserCurrency() {
    try {
        const saved = localStorage.getItem('mrartist_currency');
        if (saved && (saved === 'LKR' || saved === 'USD')) {
            return saved;
        }
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.toLowerCase().includes('colombo')) {
            return 'LKR';
        }
        return 'USD';
    } catch (e) {
        return 'LKR';
    }
}

window.setCurrency = function(currency) {
    if (currency !== 'LKR' && currency !== 'USD') return;
    currentCurrency = currency;
    try {
        localStorage.setItem('mrartist_currency', currency);
    } catch (e) {}

    // Update Switcher Buttons UI in Navbar
    const btnLkr = document.getElementById('curr-btn-lkr');
    const btnUsd = document.getElementById('curr-btn-usd');
    if (btnLkr && btnUsd) {
        if (currency === 'LKR') {
            btnLkr.className = "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 bg-[#C85A32] text-white shadow-xs";
            btnUsd.className = "px-2.5 py-1 rounded-full text-[10px] font-bold text-[#666666] hover:text-[#222222] transition-all duration-200";
        } else {
            btnUsd.className = "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 bg-[#C85A32] text-white shadow-xs";
            btnLkr.className = "px-2.5 py-1 rounded-full text-[10px] font-bold text-[#666666] hover:text-[#222222] transition-all duration-200";
        }
    }

    renderFilteredSamples();
};

// ----------------- State & Filtering -----------------
let allSamples = [];
let activeFormatFilter = 'all'; // 'all' | 'landscape' | 'triptych' | 'a3' | 'a4'

window.setFormatFilter = function(filterKey) {
    activeFormatFilter = filterKey;
    document.querySelectorAll('.format-filter-btn').forEach(btn => {
        const key = btn.getAttribute('data-filter');
        if (key === filterKey) {
            btn.className = "format-filter-btn px-4 py-2 rounded-full text-xs font-bold bg-[#C85A32] text-white shadow-xs transition";
        } else {
            btn.className = "format-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-[#F5F2EB] border border-[#E8E3D9] text-[#666] hover:text-[#222] transition";
        }
    });
    renderFilteredSamples();
};

window.filterSamples = function() {
    renderFilteredSamples();
};

window.resetFilters = function() {
    const searchInput = document.getElementById('sample-search-input');
    if (searchInput) searchInput.value = '';
    window.setFormatFilter('all');
};

function updateCounts() {
    const countAll = allSamples.length;
    const countCustom = allSamples.filter(s => s.isCustomDesign || (s.name || '').toLowerCase().includes('custom') || (s.id || '').includes('custom')).length;
    const countLandscape = allSamples.filter(s => (s.size || '').toLowerCase().includes('landscape')).length;
    const countTriptych = allSamples.filter(s => (s.size || '').toLowerCase().includes('triptych')).length;
    const countA3 = allSamples.filter(s => (s.size || '').toLowerCase().includes('a3')).length;
    const countA4 = allSamples.filter(s => (s.size || '').toLowerCase().includes('a4')).length;

    const elAll = document.getElementById('count-all');
    const elCustom = document.getElementById('count-custom');
    const elLandscape = document.getElementById('count-landscape');
    const elTriptych = document.getElementById('count-triptych');
    const elA3 = document.getElementById('count-a3');
    const elA4 = document.getElementById('count-a4');

    if (elAll) elAll.textContent = countAll;
    if (elCustom) elCustom.textContent = countCustom;
    if (elLandscape) elLandscape.textContent = countLandscape;
    if (elTriptych) elTriptych.textContent = countTriptych;
    if (elA3) elA3.textContent = countA3;
    if (elA4) elA4.textContent = countA4;
}

function renderFilteredSamples() {
    const grid = document.getElementById('all-samples-grid');
    const emptyState = document.getElementById('no-samples-found');
    const searchInput = document.getElementById('sample-search-input');
    if (!grid) return;

    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = allSamples.filter(sample => {
        const nameMatch = (sample.name || '').toLowerCase().includes(query) ||
                          (sample.size || '').toLowerCase().includes(query);
        if (!nameMatch) return false;

        const sz = (sample.size || '').toLowerCase();
        if (activeFormatFilter === 'custom') return sample.isCustomDesign || (sample.name || '').toLowerCase().includes('custom') || (sample.id || '').includes('custom');
        if (activeFormatFilter === 'landscape') return sz.includes('landscape');
        if (activeFormatFilter === 'triptych') return sz.includes('triptych');
        if (activeFormatFilter === 'a3') return sz.includes('a3');
        if (activeFormatFilter === 'a4') return sz.includes('a4');
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = filtered.map(sample => {
        const priceDisplay = formatPrice(sample.rawPrice || sample.price || 2800);
        const waMsg = encodeURIComponent('Hello Mr.Artist! 🎨\nI would like to order this printed sample:\n• Title: ' + sample.name + '\n• Format: ' + sample.size + '\n• Price: ' + priceDisplay + '\n\nPlease confirm delivery details. Thank you!');
        const waLink = 'https://wa.me/94722043235?text=' + waMsg;

        return '<div class="glass-card rounded-3xl overflow-hidden border border-[#E8E3D9] hover:border-[#C85A32]/40 transition-all duration-300 shadow-soft flex flex-col justify-between group bg-white/90">' +
            '<div class="relative w-full aspect-[4/3] bg-[#F5F2EB] overflow-hidden">' +
                '<img src="' + sample.src + '" alt="' + sample.name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" onclick="window.location.href=\'product.html?id=' + encodeURIComponent(sample.id) + '&type=sample\'">' +
                '<div class="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-full border border-[#E8E3D9] text-[10px] font-bold text-[#1E1E1E] shadow-2xs">' +
                    sample.size +
                '</div>' +
                '<div class="absolute top-3 right-3 px-3 py-1 bg-[#FBF2ED] rounded-full border border-[#C85A32]/25 text-[11px] font-bold text-[#C85A32] shadow-2xs">' +
                    priceDisplay +
                '</div>' +
            '</div>' +
            '<div class="p-5 space-y-3 flex-1 flex flex-col justify-between">' +
                '<div>' +
                    '<h4 onclick="window.location.href=\'product.html?id=' + encodeURIComponent(sample.id) + '&type=sample\'" class="font-serif font-bold text-base text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors line-clamp-1 cursor-pointer">' + sample.name + '</h4>' +
                    '<p class="text-xs text-[#666666] mt-0.5">' + sample.size + '</p>' +
                '</div>' +
                '<div class="space-y-2 pt-1">' +
                    '<a href="product.html?id=' + sample.id + '&type=sample" class="w-full py-2 bg-white hover:bg-[#FBF2ED] text-[#222222] hover:text-[#C85A32] font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 border border-[#E8E3D9]">' +
                        '<i class="fa-solid fa-eye text-[11px] text-[#C85A32]"></i>' +
                        '<span>View Piece Details</span>' +
                    '</a>' +
                    '<a href="' + waLink + '" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 bg-[#FBF2ED] hover:bg-[#C85A32] text-[#C85A32] hover:text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 border border-[#C85A32]/25">' +
                        '<i class="fa-brands fa-whatsapp text-sm"></i>' +
                        '<span>Direct Order (' + priceDisplay + ')</span>' +
                    '</a>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// ----------------- Dismiss Preloader -----------------
function dismissPreloader() {
    const preloader = document.getElementById('page-preloader');
    if (preloader) {
        preloader.classList.add('loaded');
        setTimeout(() => {
            if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 450);
    }
}

// ----------------- Page Initialization -----------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Currency Init
    const initialCurrency = detectUserCurrency();
    window.setCurrency(initialCurrency);

    // 2. Fetch all live samples from Supabase
    const liveSamples = await fetchSamples();
    if (liveSamples && liveSamples.length > 0) {
        allSamples = liveSamples;
    } else {
        allSamples = defaultSamples;
    }

    // 3. Update Counts and Render
    updateCounts();
    renderFilteredSamples();

    // 4. Smoothly Dismiss Preloader
    setTimeout(dismissPreloader, 300);
});

window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 450);
});
