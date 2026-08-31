import { initAdBlockDetector } from './adblock.js';
initAdBlockDetector();
import './style.css';
import { fetchArtworks, defaultArtworks } from './supabase.js';

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

    updateFormatPriceTags();
    calculateArtworkQuote();
    renderArtworkShowcaseGrid();
};

// ----------------- State & Product Details -----------------
let currentArtwork = null;
let allArtworks = [...defaultArtworks];
let selectedFormat = 'triptych-4mm';
let quantity = 1;

const formatPrices = {
    'triptych-4mm': 3200,
    'landscape-4mm': 2800,
    'a3': 900,
    'a4': 500
};

const formatNames = {
    'triptych-4mm': '12.5 x 18" x3 Triptych Set (4mm Rigid Board)',
    'landscape-4mm': '12.5 x 24.5" Landscape (4mm Rigid Board)',
    'a3': 'A3 Size Fine Art Board (300GSM)',
    'a4': 'A4 Size Fine Art Board (300GSM)'
};

function updateFormatPriceTags() {
    document.querySelectorAll('[data-format-price]').forEach(el => {
        const fmt = el.getAttribute('data-format-price');
        const price = formatPrices[fmt] || 500;
        el.textContent = formatPrice(price);
    });

    const activePriceEl = document.getElementById('artwork-active-price');
    if (activePriceEl) {
        const activePrice = formatPrices[selectedFormat] || 3200;
        activePriceEl.textContent = formatPrice(activePrice);
    }
}

window.selectFormat = function(formatKey) {
    selectedFormat = formatKey;
    document.querySelectorAll('.format-card').forEach(btn => {
        const fmt = btn.getAttribute('data-format');
        const dot = btn.querySelector('.format-dot');
        if (fmt === formatKey) {
            btn.classList.add('border-[#C85A32]', 'bg-[#FBF2ED]', 'text-[#C85A32]', 'shadow-xs');
            btn.classList.remove('border-[#E8E3D9]', 'bg-white', 'text-[#222222]');
            if (dot) {
                dot.classList.remove('bg-transparent');
                dot.classList.add('bg-[#C85A32]');
            }
        } else {
            btn.classList.remove('border-[#C85A32]', 'bg-[#FBF2ED]', 'text-[#C85A32]', 'shadow-xs');
            btn.classList.add('border-[#E8E3D9]', 'bg-white', 'text-[#222222]');
            if (dot) {
                dot.classList.add('bg-transparent');
                dot.classList.remove('bg-[#C85A32]');
            }
        }
    });

    updateFormatPriceTags();
    calculateArtworkQuote();
};

window.changeQty = function(delta) {
    quantity = Math.max(1, Math.min(99, quantity + delta));
    const qtyInput = document.getElementById('artwork-qty-input');
    if (qtyInput) qtyInput.value = quantity;
    calculateArtworkQuote();
};

window.calculateArtworkQuote = function() {
    const upscaleCheck = document.getElementById('opt-upscale-check');
    const customCheck = document.getElementById('opt-custom-check');
    const qtyInput = document.getElementById('artwork-qty-input');

    if (qtyInput) {
        quantity = Math.max(1, parseInt(qtyInput.value) || 1);
    }

    let unitPrice = formatPrices[selectedFormat] || 3200;
    if (upscaleCheck && upscaleCheck.checked) unitPrice += 500;
    if (customCheck && customCheck.checked) unitPrice += 500;

    const subtotalLKR = unitPrice * quantity;
    const deliveryLKR = 450;
    const totalLKR = subtotalLKR + deliveryLKR;

    const totalEl = document.getElementById('artwork-total-price');
    const subtotalEl = document.getElementById('artwork-subtotal-calc');

    if (totalEl) {
        totalEl.textContent = formatPrice(totalLKR);
    }

    if (subtotalEl) {
        if (currentCurrency === 'USD') {
            subtotalEl.textContent = formatPrice(subtotalLKR) + ' + ' + formatPrice(deliveryLKR) + ' delivery';
        } else {
            subtotalEl.textContent = 'LKR ' + subtotalLKR.toLocaleString() + ' + LKR ' + deliveryLKR + ' delivery';
        }
    }
};

window.sendArtworkWhatsAppOrder = function() {
    if (!currentArtwork) return;

    const upscaleCheck = document.getElementById('opt-upscale-check');
    const customCheck = document.getElementById('opt-custom-check');
    const totalEl = document.getElementById('artwork-total-price');

    const formatName = formatNames[selectedFormat] || selectedFormat;
    let services = [];
    if (upscaleCheck && upscaleCheck.checked) services.push('Photo AI Upscaling (+' + formatPrice(500) + ')');
    if (customCheck && customCheck.checked) services.push('Custom Crop / Tone (+' + formatPrice(500) + ')');
    const servicesText = services.length > 0 ? services.join(', ') : 'Curated Edition Print';

    const total = totalEl ? totalEl.textContent : formatPrice(3650);

    const message = 'Hello Mr.Artist! 🎨\n' +
'I would like to order this signature wall artwork:\n\n' +
'• Title: ' + currentArtwork.name + '\n' +
'• Format: ' + formatName + '\n' +
'• Quantity: ' + quantity + '\n' +
'• Currency: ' + currentCurrency + '\n' +
'• Custom Add-ons: ' + servicesText + '\n' +
'• Estimated Total: ' + total + '\n' +
'• Artwork URL: ' + window.location.href + '\n\n' +
'Please confirm dispatch and order details. Thank you!';

    const encoded = encodeURIComponent(message);
    window.open('https://wa.me/94722043235?text=' + encoded, '_blank');
};

// ----------------- Accordions -----------------
window.toggleAccordion = function(id) {
    const content = document.getElementById('acc-content-' + id);
    const icon = document.getElementById('acc-icon-' + id);
    if (!content) return;

    const isOpen = !content.classList.contains('hidden');
    if (isOpen) {
        content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
};

// ----------------- Lightbox Zoom -----------------
window.openFullscreenZoom = function() {
    if (!currentArtwork) return;
    const modal = document.getElementById('fullscreen-zoom-modal');
    const modalImg = document.getElementById('zoom-modal-img');
    const modalTitle = document.getElementById('zoom-modal-title');
    if (!modal || !modalImg) return;

    modalImg.src = currentArtwork.src;
    if (modalTitle) modalTitle.textContent = currentArtwork.name;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';
};

window.closeFullscreenZoom = function() {
    const modal = document.getElementById('fullscreen-zoom-modal');
    if (!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('opacity-100');
    document.body.style.overflow = '';
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

// ----------------- Render Bottom Artworks Showcase Grid -----------------
function renderArtworkShowcaseGrid() {
    const grid = document.getElementById('artworks-showcase-grid');
    if (!grid) return;

    const currentId = currentArtwork ? String(currentArtwork.id) : '';
    const otherItems = allArtworks.filter(item => String(item.id) !== currentId);

    grid.innerHTML = otherItems.slice(0, 4).map(item => {
        const priceDisplay = formatPrice(item.rawPrice || item.price || 2800);
        return '<a href="/artwork.html?id=' + item.id + '" class="glass-card rounded-2xl overflow-hidden border border-[#E8E3D9] hover:border-[#C85A32]/40 transition-all duration-300 shadow-soft flex flex-col group bg-white/80">' +
            '<div class="relative w-full aspect-[4/3] bg-[#F5F2EB] overflow-hidden">' +
                '<img src="' + item.src + '" alt="' + item.name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">' +
                '<div class="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs rounded-full border border-[#E8E3D9] text-[9px] font-bold text-[#222222] shadow-2xs">' +
                    (item.tag || 'Signature Art') +
                '</div>' +
                '<div class="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#FBF2ED] rounded-full border border-[#C85A32]/25 text-[10px] font-bold text-[#C85A32] shadow-2xs">' +
                    priceDisplay +
                '</div>' +
            '</div>' +
            '<div class="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">' +
                '<div>' +
                    '<h4 class="font-serif font-bold text-sm text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors line-clamp-1">' + item.name + '</h4>' +
                    '<p class="text-[11px] text-[#666666] line-clamp-1 mt-0.5">' + (item.desc || 'Curated Fine Artwork') + '</p>' +
                '</div>' +
                '<div class="pt-1 flex items-center justify-between text-xs font-bold text-[#C85A32]">' +
                    '<span>View Artwork</span>' +
                    '<i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>' +
                '</div>' +
            '</div>' +
        '</a>';
    }).join('');
}

// ----------------- Page Initialization -----------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Currency Init
    const initialCurrency = detectUserCurrency();
    window.setCurrency(initialCurrency);

    // 2. Fetch all live artworks from Supabase
    const liveArtworks = await fetchArtworks();
    if (liveArtworks && liveArtworks.length > 0) {
        allArtworks = liveArtworks;
    } else {
        allArtworks = defaultArtworks;
    }

    // 3. Find matching artwork from URL query (?id=... or ?name=...)
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    const queryName = params.get('name');

    if (queryId) {
        currentArtwork = allArtworks.find(a => String(a.id) === String(queryId)) ||
                         allArtworks[0];
    } else if (queryName) {
        currentArtwork = allArtworks.find(a => a.name.toLowerCase().includes(queryName.toLowerCase())) ||
                         allArtworks[0];
    } else {
        currentArtwork = allArtworks[0];
    }

    // 4. Populate Artwork Info
    if (currentArtwork) {
        const titleEl = document.getElementById('artwork-title');
        const descEl = document.getElementById('artwork-desc');
        const tagEl = document.getElementById('artwork-badge-tag');
        const editionTag = document.getElementById('edition-type-tag');
        const mainImg = document.getElementById('main-artwork-image');
        const breadcrumbTitle = document.getElementById('breadcrumb-title');

        if (titleEl) titleEl.textContent = currentArtwork.name;
        if (descEl) descEl.textContent = currentArtwork.desc || 'Curated fine art edition with rich archival pigmentation.';
        if (tagEl) tagEl.textContent = currentArtwork.tag || 'Curated Signature Art';
        if (editionTag) editionTag.textContent = currentArtwork.category ? (currentArtwork.category.toUpperCase() + ' ARCHIVE') : 'CURATED ARTWORK EDITION';
        if (breadcrumbTitle) breadcrumbTitle.textContent = currentArtwork.name;
        if (mainImg) mainImg.src = currentArtwork.src;

        document.title = currentArtwork.name + ' | Mr.Artist Wall Art Studio';

        // Auto-select format matching the artwork format
        const fmt = (currentArtwork.format || currentArtwork.tag || '').toLowerCase();
        if (fmt.includes('triptych')) {
            window.selectFormat('triptych-4mm');
        } else if (fmt.includes('landscape')) {
            window.selectFormat('landscape-4mm');
        } else if (fmt.includes('a3')) {
            window.selectFormat('a3');
        } else if (fmt.includes('a4')) {
            window.selectFormat('a4');
        } else {
            window.selectFormat('triptych-4mm');
        }
    }

    // 5. Render Showcase Grid of other artworks
    renderArtworkShowcaseGrid();

    // 6. Smoothly Dismiss Preloader
    setTimeout(dismissPreloader, 350);
});

window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 500);
});
