import { initAdBlockDetector } from './adblock.js';
initAdBlockDetector();
import './style.css';
import { fetchArtworks, defaultArtworks, fetchSamples } from './supabase.js';

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
    calculateProductQuote();
    renderSampleShowcaseGrid();
};

// ----------------- State & Product Details -----------------
let currentProduct = null;
let isSample = true;
let allArtworks = [...defaultArtworks];
let allSamples = [];
let selectedFormat = 'landscape-4mm';
let quantity = 1;

const formatPrices = {
    'landscape-4mm': 2800,
    'triptych-4mm': 3200,
    'a3': 900,
    'a4': 500
};

const formatNames = {
    'landscape-4mm': '12.5 x 24.5" Landscape (4mm Rigid Board)',
    'triptych-4mm': '12.5 x 18" x3 Triptych Set (4mm Rigid Board)',
    'a3': 'A3 Size Fine Art Board (300GSM)',
    'a4': 'A4 Size Fine Art Board (300GSM)'
};

function updateFormatPriceTags() {
    document.querySelectorAll('[data-format-price]').forEach(el => {
        const fmt = el.getAttribute('data-format-price');
        const price = formatPrices[fmt] || 500;
        el.textContent = formatPrice(price);
    });

    const activePriceEl = document.getElementById('product-active-price');
    if (activePriceEl) {
        const activePrice = formatPrices[selectedFormat] || 2800;
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
    calculateProductQuote();
};

window.changeQty = function(delta) {
    quantity = Math.max(1, Math.min(99, quantity + delta));
    const qtyInput = document.getElementById('product-qty-input');
    if (qtyInput) qtyInput.value = quantity;
    calculateProductQuote();
};

window.calculateProductQuote = function() {
    const upscaleCheck = document.getElementById('opt-upscale-check');
    const customCheck = document.getElementById('opt-custom-check');
    const qtyInput = document.getElementById('product-qty-input');

    if (qtyInput) {
        quantity = Math.max(1, parseInt(qtyInput.value) || 1);
    }

    let unitPrice = formatPrices[selectedFormat] || 2800;
    if (upscaleCheck && upscaleCheck.checked) unitPrice += 500;
    if (customCheck && customCheck.checked) unitPrice += 500;

    const subtotalLKR = unitPrice * quantity;
    const deliveryLKR = 450;
    const totalLKR = subtotalLKR + deliveryLKR;

    const totalEl = document.getElementById('product-total-price');
    const subtotalEl = document.getElementById('product-subtotal-calc');

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

window.sendProductWhatsAppOrder = function() {
    if (!currentProduct) return;

    const upscaleCheck = document.getElementById('opt-upscale-check');
    const customCheck = document.getElementById('opt-custom-check');
    const totalEl = document.getElementById('product-total-price');

    const formatName = formatNames[selectedFormat] || selectedFormat;
    let services = [];
    if (upscaleCheck && upscaleCheck.checked) services.push('Photo AI Upscaling (+' + formatPrice(500) + ')');
    if (customCheck && customCheck.checked) services.push('Custom Art / Crop (+' + formatPrice(500) + ')');
    const servicesText = services.length > 0 ? services.join(', ') : 'Standard Board Print';

    const total = totalEl ? totalEl.textContent : formatPrice(3250);

    const message = 'Hello Mr.Artist! 🎨\n' +
'I would like to order this wall piece:\n\n' +
'• Title: ' + currentProduct.name + '\n' +
'• Format: ' + formatName + '\n' +
'• Quantity: ' + quantity + '\n' +
'• Currency: ' + currentCurrency + '\n' +
'• Custom Add-ons: ' + servicesText + '\n' +
'• Estimated Total: ' + total + '\n' +
'• Product URL: ' + window.location.href + '\n\n' +
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
    if (!currentProduct) return;
    const modal = document.getElementById('fullscreen-zoom-modal');
    const modalImg = document.getElementById('zoom-modal-img');
    const modalTitle = document.getElementById('zoom-modal-title');
    if (!modal || !modalImg) return;

    modalImg.src = currentProduct.src;
    if (modalTitle) modalTitle.textContent = currentProduct.name;
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

// ----------------- Render Bottom Samples Showcase Grid -----------------
function renderSampleShowcaseGrid() {
    const grid = document.getElementById('samples-showcase-grid');
    if (!grid) return;

    const items = allSamples.length > 0 ? allSamples : allArtworks;
    const currentId = currentProduct ? String(currentProduct.id) : '';
    const otherItems = items.filter(item => String(item.id) !== currentId);

    grid.innerHTML = otherItems.slice(0, 4).map(item => {
        const priceDisplay = formatPrice(item.rawPrice || item.price || 2800);
        const itemType = item.size ? 'sample' : 'artwork';
        return '<a href="/product.html?id=' + item.id + '&type=' + itemType + '" class="glass-card rounded-2xl overflow-hidden border border-[#E8E3D9] hover:border-[#C85A32]/40 transition-all duration-300 shadow-soft flex flex-col group bg-white/80">' +
            '<div class="relative w-full aspect-[4/3] bg-[#F5F2EB] overflow-hidden">' +
                '<img src="' + item.src + '" alt="' + item.name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">' +
                '<div class="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs rounded-full border border-[#E8E3D9] text-[9px] font-bold text-[#222222] shadow-2xs">' +
                    (item.size || item.tag || '4mm Board') +
                '</div>' +
                '<div class="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#FBF2ED] rounded-full border border-[#C85A32]/25 text-[10px] font-bold text-[#C85A32] shadow-2xs">' +
                    priceDisplay +
                '</div>' +
            '</div>' +
            '<div class="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">' +
                '<div>' +
                    '<h4 class="font-serif font-bold text-sm text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors line-clamp-1">' + item.name + '</h4>' +
                    '<p class="text-[11px] text-[#666666] line-clamp-1 mt-0.5">' + (item.size || item.desc || 'Real printed sample') + '</p>' +
                '</div>' +
                '<div class="pt-1 flex items-center justify-between text-xs font-bold text-[#C85A32]">' +
                    '<span>View Piece</span>' +
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

    // 2. Fetch artworks and samples
    const [liveArtworks, liveSamples] = await Promise.all([
        fetchArtworks(),
        fetchSamples()
    ]);

    if (liveArtworks && liveArtworks.length > 0) {
        allArtworks = liveArtworks;
    }
    if (liveSamples && liveSamples.length > 0) {
        allSamples = liveSamples;
    }

    // 3. Find matching product from URL query (?id=... & type=sample)
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    const queryType = params.get('type');
    const queryName = params.get('name');

    if (queryType === 'sample' || (queryId && String(queryId).startsWith('sample'))) {
        isSample = true;
        currentProduct = allSamples.find(s => String(s.id) === String(queryId)) ||
                         allSamples.find(s => s.name.toLowerCase().includes((queryName || '').toLowerCase())) ||
                         allSamples[0] || allArtworks[0];
    } else if (queryId) {
        currentProduct = allSamples.find(s => String(s.id) === String(queryId)) ||
                         allArtworks.find(a => String(a.id) === String(queryId)) ||
                         allSamples[0] || allArtworks[0];
    } else if (queryName) {
        currentProduct = allSamples.find(s => s.name.toLowerCase().includes(queryName.toLowerCase())) ||
                         allArtworks.find(a => a.name.toLowerCase().includes(queryName.toLowerCase())) ||
                         allSamples[0] || allArtworks[0];
    } else {
        currentProduct = allSamples[0] || allArtworks[0];
    }

    // 4. Populate Product Info
    if (currentProduct) {
        const titleEl = document.getElementById('product-title');
        const tagEl = document.getElementById('product-badge-tag');
        const editionTag = document.getElementById('edition-type-tag');
        const mainImg = document.getElementById('main-product-image');
        const breadcrumbTitle = document.getElementById('breadcrumb-title');
        const breadcrumbCat = document.getElementById('breadcrumb-category-link');

        if (titleEl) titleEl.textContent = currentProduct.name;
        if (tagEl) tagEl.textContent = currentProduct.size || currentProduct.tag || '12.5 x 24.5" 4mm Rigid Board';
        if (editionTag) editionTag.textContent = isSample ? 'Printed Studio Showcase' : 'Curated Gallery Artwork';
        if (breadcrumbTitle) breadcrumbTitle.textContent = currentProduct.name;
        if (breadcrumbCat) {
            breadcrumbCat.textContent = isSample ? 'Printed Samples' : 'Curated Gallery';
            breadcrumbCat.href = isSample ? '/#samples' : '/#gallery';
        }
        if (mainImg) mainImg.src = currentProduct.src;

        document.title = currentProduct.name + ' | Mr.Artist Wall Art Studio';

        // Auto-select format matching the product size
        const sz = (currentProduct.size || '').toLowerCase();
        if (sz.includes('triptych')) {
            window.selectFormat('triptych-4mm');
        } else if (sz.includes('a3')) {
            window.selectFormat('a3');
        } else if (sz.includes('a4')) {
            window.selectFormat('a4');
        } else {
            window.selectFormat('landscape-4mm');
        }
    }

    // 5. Render Samples Showcase Grid
    renderSampleShowcaseGrid();

    // 6. Smoothly Dismiss Preloader
    setTimeout(dismissPreloader, 350);
});

// Fallback preloader dismissal if anything takes longer
window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 500);
});
