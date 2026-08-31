import { initAdBlockDetector } from './adblock.js';
initAdBlockDetector();
import './style.css';

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
    
    let formatted = '';
    if (currentCurrency === 'USD') {
        const usdVal = num / USD_EXCHANGE_RATE;
        formatted = '$' + usdVal.toFixed(2);
    } else {
        formatted = 'LKR ' + num.toLocaleString();
    }

    if (options.prefix) {
        return options.prefix + formatted + (options.suffix || '');
    }
    return formatted;
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

    renderFormatOptions();
    calculateQuote();
};

// ----------------- State & Options -----------------
let activeServiceType = 'bundle'; // 'bundle' | 'digital'
let activeSubjectKey = 'vehicle';
let activeFormatKey = 'a4';

const subjectTitles = {
    'vehicle': 'Supercar / Vehicle Spec Poster',
    'anime': 'Anime & Manga Character Poster',
    'gaming': 'Gaming & Superhero Art Poster',
    'portrait': 'Personal / Bespoke Portrait Poster'
};

const pricingMatrix = {
    'bundle': {
        'a4': { name: 'A4 Complete Package (Design + 300GSM Board)', desc: '21 x 30 cm • Desk & Gallery Print', price: 3000 },
        'a3': { name: 'A3 Complete Package (Design + 300GSM Board)', desc: '30 x 42 cm • Premium Room Centerpiece', price: 4500 },
        'landscape-4mm': { name: '12.5 x 24.5" Landscape (Design + 4mm Rigid Board)', desc: 'Horizontal Masterpiece • 2600GSM Core', price: 6000 },
        'triptych-4mm': { name: '12.5 x 18" x3 Triptych (Design + 4mm Rigid Set)', desc: '3-Panel Continuous Luxury Wall Art', price: 7500 },
        'ultra': { name: 'Ultra Detailed / Fully Custom Artwork + Board Print', desc: 'Complex Multi-Subject or Architectural Artwork', price: 5000 }
    },
    'digital': {
        'a4': { name: 'A4 Custom Digital Design (300DPI Softcopy)', desc: 'High-Resolution File via Email/WhatsApp', price: 1500 },
        'a3': { name: 'A3 Premium Digital Design (300DPI Softcopy)', desc: 'High-Resolution File via Email/WhatsApp', price: 2500 },
        'ultra': { name: 'Ultra Detailed / Custom Concept (300DPI Softcopy)', desc: 'Complex Multi-Subject or Bespoke Concept', price: 4000 }
    }
};

window.setServiceType = function(type) {
    activeServiceType = type;
    const btnBundle = document.getElementById('svc-btn-bundle');
    const btnDigital = document.getElementById('svc-btn-digital');

    if (type === 'bundle') {
        btnBundle.className = "p-3.5 rounded-2xl border-2 border-[#C85A32] bg-[#FBF2ED] text-[#C85A32] text-left transition shadow-xs";
        btnBundle.querySelector('i').classList.remove('opacity-0');
        btnDigital.className = "p-3.5 rounded-2xl border-2 border-[#E8E3D9] bg-white text-[#222222] text-left transition shadow-xs hover:border-[#C85A32]/40";
        btnDigital.querySelector('i').classList.add('opacity-0');
        document.getElementById('quote-price-label').textContent = 'Starting Price (Design + Print):';
    } else {
        btnDigital.className = "p-3.5 rounded-2xl border-2 border-[#C85A32] bg-[#FBF2ED] text-[#C85A32] text-left transition shadow-xs";
        btnDigital.querySelector('i').classList.remove('opacity-0');
        btnBundle.className = "p-3.5 rounded-2xl border-2 border-[#E8E3D9] bg-white text-[#222222] text-left transition shadow-xs hover:border-[#C85A32]/40";
        btnBundle.querySelector('i').classList.add('opacity-0');
        document.getElementById('quote-price-label').textContent = 'Starting Price (Digital Softcopy):';
    }

    // Ensure valid format key for selected service type
    const availableKeys = Object.keys(pricingMatrix[type]);
    if (!availableKeys.includes(activeFormatKey)) {
        activeFormatKey = availableKeys[0];
    }

    renderFormatOptions();
    calculateQuote();
};

window.setCustomSubject = function(subjKey) {
    activeSubjectKey = subjKey;
    document.querySelectorAll('.custom-subj-btn').forEach(btn => {
        const key = btn.getAttribute('data-subj');
        if (key === subjKey) {
            btn.className = "custom-subj-btn px-3 py-2.5 rounded-xl text-xs font-bold bg-[#FBF2ED] border-2 border-[#C85A32] text-[#C85A32] text-left transition shadow-2xs flex items-center gap-2";
        } else {
            btn.className = "custom-subj-btn px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E8E3D9] text-[#666] text-left hover:text-[#222] transition flex items-center gap-2";
        }
    });
};

window.selectFormat = function(fmtKey) {
    activeFormatKey = fmtKey;
    renderFormatOptions();
    calculateQuote();
};

function renderFormatOptions() {
    const list = document.getElementById('custom-format-list');
    if (!list) return;

    const formats = pricingMatrix[activeServiceType];
    const keys = Object.keys(formats);

    list.innerHTML = keys.map(k => {
        const item = formats[k];
        const isSelected = k === activeFormatKey;
        const priceDisplay = formatPrice(item.price, { prefix: 'From ' });

        const borderBg = isSelected
            ? 'border-[#C85A32] bg-[#FBF2ED] text-[#C85A32]'
            : 'border-[#E8E3D9] bg-white text-[#222222] hover:border-[#C85A32]/40';
        
        const dotBg = isSelected ? 'bg-[#C85A32]' : 'bg-transparent';
        const dotBorder = isSelected ? 'border-[#C85A32]' : 'border-[#BBB]';
        const priceColor = isSelected ? 'text-[#C85A32]' : 'text-[#222]';

        return '<div onclick="selectFormat(\'' + k + '\')" class="cursor-pointer border-2 ' + borderBg + ' rounded-xl p-3 flex items-center justify-between transition shadow-2xs">' +
            '<div class="flex items-center gap-2.5">' +
                '<div class="w-3.5 h-3.5 rounded-full border-2 ' + dotBorder + ' flex items-center justify-center p-0.5 shrink-0">' +
                    '<div class="w-full h-full ' + dotBg + ' rounded-full"></div>' +
                '</div>' +
                '<div>' +
                    '<p class="text-xs font-bold text-[#1E1E1E]">' + item.name + '</p>' +
                    '<p class="text-[10px] text-[#666]">' + item.desc + '</p>' +
                '</div>' +
            '</div>' +
            '<span class="text-xs font-bold font-display ' + priceColor + '">' + priceDisplay + '</span>' +
        '</div>';
    }).join('');
}

function calculateQuote() {
    const totalEl = document.getElementById('custom-quote-total');
    const breakdownEl = document.getElementById('custom-quote-breakdown');
    if (!totalEl) return;

    const item = pricingMatrix[activeServiceType][activeFormatKey] || Object.values(pricingMatrix[activeServiceType])[0];
    const total = item.price;

    totalEl.textContent = formatPrice(total, { prefix: 'From ' });

    if (breakdownEl) {
        if (activeServiceType === 'bundle') {
            breakdownEl.textContent = 'Starting price • Scope-based quotation';
        } else {
            breakdownEl.textContent = 'Starting price • 300DPI digital file';
        }
    }
}

window.sendCustomWhatsAppOrder = function() {
    const subjectInput = document.getElementById('custom-subject-input');
    const totalEl = document.getElementById('custom-quote-total');

    const subjectTitle = subjectTitles[activeSubjectKey] || 'Custom Spec Poster';
    const subjectDetail = subjectInput && subjectInput.value.trim() ? subjectInput.value.trim() : 'Custom Spec Reference';
    const item = pricingMatrix[activeServiceType][activeFormatKey] || Object.values(pricingMatrix[activeServiceType])[0];
    const total = totalEl ? totalEl.textContent : formatPrice(item.price, { prefix: 'From ' });
    const serviceLabel = activeServiceType === 'bundle' ? 'Complete Package (Graphic Design + 4mm Board Print)' : 'Digital Design Only (High-Res 300DPI Softcopy)';

    const message = 'Hello Ganusha / Mr.Artist! 🎨\n' +
'I would like to order a Custom Poster Design:\n\n' +
'• Service Type: ' + serviceLabel + '\n' +
'• Category: ' + subjectTitle + '\n' +
'• Subject / Vehicle: ' + subjectDetail + '\n' +
'• Selected Option: ' + item.name + '\n' +
'• Estimated Quote: ' + total + '\n\n' +
'I have reference photos ready. Please let me know how we can proceed with the design!';

    window.open('https://wa.me/94722043235?text=' + encodeURIComponent(message), '_blank');
};

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
document.addEventListener('DOMContentLoaded', () => {
    const initialCurrency = detectUserCurrency();
    window.setCurrency(initialCurrency);
    renderFormatOptions();
    calculateQuote();
    setTimeout(dismissPreloader, 350);
});

window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 500);
});
