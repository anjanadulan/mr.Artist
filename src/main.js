import { initAdBlockDetector } from './adblock.js';
initAdBlockDetector();
import * as THREE from 'three';
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
        const formatted = `$${usdVal.toFixed(2)}`;
        if (options.prefix) return `${options.prefix}${formatted}${options.suffix || ''}`;
        return formatted;
    } else {
        const formatted = `LKR ${num.toLocaleString()}`;
        if (options.prefix) return `${options.prefix}${formatted}${options.suffix || ''}`;
        return formatted;
    }
}

export function detectUserCurrency() {
    try {
        const saved = localStorage.getItem('mrartist_currency');
        if (saved && (saved === 'LKR' || saved === 'USD')) {
            return saved;
        }
        // Auto-detect based on Sri Lanka timezone
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.toLowerCase().includes('colombo')) {
            return 'LKR';
        }
        // If outside Sri Lanka, default to USD for seamless international experience
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

    // 1. Update Switcher Toggle UI in Navbar
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

    // 2. Update Static Data-Price Elements
    document.querySelectorAll('[data-price-lkr]').forEach(el => {
        const lkr = parseFloat(el.getAttribute('data-price-lkr'));
        const prefix = el.getAttribute('data-price-prefix') || '';
        const suffix = el.getAttribute('data-price-suffix') || '';
        el.textContent = formatPrice(lkr, { prefix, suffix });
    });

    // 3. Update Gallery active card
    updateCarouselVisuals();

    // 4. Update Samples showcase
    renderLoadedSamples();

    // 5. Update Quote Calculator dropdown options & calculations
    updateCalculatorDropdownLabels();
    window.calculateQuote();
};

// Active Gallery Database (Populated dynamically from Supabase)
export let galleryArtworks = [...defaultArtworks];
export let showcaseSamples = [];

// Carousel State
let carouselIndex = 0;
let filteredArtworks = [...galleryArtworks];

// Filter Gallery by Category
window.filterGallery = function(category) {
    const categories = ['all', 'landscape', 'abstract', 'botanical'];
    categories.forEach(cat => {
        const btn = document.getElementById(`cat-btn-${cat}`);
        if (btn) {
            if (cat === category) {
                btn.className = "px-5 py-2 rounded-full text-xs font-bold bg-[#C85A32] text-white shadow-sm transition";
            } else {
                btn.className = "px-5 py-2 rounded-full text-xs font-semibold bg-white border border-[#E8E3D9] text-[#666666] hover:text-[#222222] hover:border-[#C85A32]/50 transition";
            }
        }
    });

    if (category === 'all') {
        filteredArtworks = [...galleryArtworks];
    } else {
        filteredArtworks = galleryArtworks.filter(a => a.category === category);
    }

    carouselIndex = 0;
    renderGallery();
};

function renderGallery() {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    if (filteredArtworks.length === 0) {
        track.innerHTML = `<p class="text-sm text-[#888888] py-12">No pieces found in this category.</p>`;
        return;
    }

    track.innerHTML = filteredArtworks.map((art, idx) => {
        return `
            <div onclick="selectSlide(${idx})" 
                class="carousel-slide absolute w-[260px] sm:w-[340px] md:w-[400px] aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#E8E3D9] shadow-lg cursor-pointer select-none"
                style="transform: scale(0.7); opacity: 0; z-index: 10;">
                <img src="${art.src}" alt="${art.name}" class="w-full h-full object-cover pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-4 right-4 text-white">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-2 py-0.5 rounded">${art.tag}</span>
                    <h4 class="font-serif text-sm font-bold mt-1 text-white truncate">${art.name}</h4>
                </div>
            </div>
        `;
    }).join('');

    updateCarouselVisuals();
}

window.selectSlide = function(idx) {
    carouselIndex = idx;
    updateCarouselVisuals();
};

window.prevSlide = function() {
    if (filteredArtworks.length === 0) return;
    carouselIndex = (carouselIndex - 1 + filteredArtworks.length) % filteredArtworks.length;
    updateCarouselVisuals();
};

window.nextSlide = function() {
    if (filteredArtworks.length === 0) return;
    carouselIndex = (carouselIndex + 1) % filteredArtworks.length;
    updateCarouselVisuals();
};

function updateCarouselVisuals() {
    const slides = document.querySelectorAll('.carousel-slide');
    const total = slides.length;
    if (total === 0) return;

    slides.forEach((slide, i) => {
        let diff = (i - carouselIndex + total) % total;
        if (diff > total / 2) diff -= total;

        if (diff === 0) {
            slide.style.transform = 'translateX(0%) scale(1)';
            slide.style.opacity = '1';
            slide.style.zIndex = '30';
            slide.style.boxShadow = '0 20px 40px -10px rgba(200, 90, 50, 0.25)';
        } else if (diff === 1 || (total === 2 && diff === -1)) {
            slide.style.transform = 'translateX(65%) scale(0.82)';
            slide.style.opacity = '0.65';
            slide.style.zIndex = '20';
            slide.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.1)';
        } else if (diff === -1) {
            slide.style.transform = 'translateX(-65%) scale(0.82)';
            slide.style.opacity = '0.65';
            slide.style.zIndex = '20';
            slide.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.1)';
        } else {
            slide.style.transform = `translateX(${diff * 90}%) scale(0.6)`;
            slide.style.opacity = '0';
            slide.style.zIndex = '10';
        }
    });

    const activeArt = filteredArtworks[carouselIndex];
    if (activeArt) {
        const titleEl = document.getElementById('gallery-active-title');
        const descEl = document.getElementById('gallery-active-desc');
        const priceEl = document.getElementById('gallery-active-price');
        const tagEl = document.getElementById('gallery-active-tag');

        if (titleEl) titleEl.textContent = activeArt.name;
        if (descEl) descEl.textContent = activeArt.desc;
        if (priceEl) priceEl.textContent = formatPrice(activeArt.rawPrice || activeArt.price);
        if (tagEl) tagEl.textContent = activeArt.tag;
    }
}

// ----------------- Interactive Zoom Lightbox Modal -----------------
let isLightboxZoomed = false;
let currentLightboxZoomScale = 1;

window.openImagePopup = function(src, title, desc, rawPriceOrString) {
    const modal = document.getElementById('image-popup-modal');
    const modalImg = document.getElementById('popup-modal-image');
    const modalTitle = document.getElementById('popup-modal-title');
    const modalSize = document.getElementById('popup-modal-size');
    const modalDesc = document.getElementById('popup-modal-desc');
    const modalPrice = document.getElementById('popup-modal-price');
    const modalWaBtn = document.getElementById('popup-modal-wa-btn');

    if (!modal || !modalImg) return;

    // Reset Zoom
    isLightboxZoomed = false;
    currentLightboxZoomScale = 1;
    modalImg.style.transform = `scale(1)`;
    const wrapper = document.getElementById('lightbox-img-wrapper');
    if (wrapper) {
        wrapper.classList.remove('cursor-zoom-out');
        wrapper.classList.add('cursor-zoom-in');
    }

    modalImg.src = src;
    if (modalTitle) modalTitle.textContent = title || 'Mr.Artist Artwork';
    
    // Check if desc is a size or general description
    if (modalSize) {
        if (desc && (desc.includes('Board') || desc.includes('Triptych') || desc.includes('x') || desc.includes('"'))) {
            modalSize.textContent = desc;
            modalSize.classList.remove('hidden');
            if (modalDesc) modalDesc.textContent = 'High-resolution printed wall board setup.';
        } else {
            modalSize.textContent = 'Fine Wall Art';
            if (modalDesc) modalDesc.textContent = desc || '';
        }
    }

    const formattedPrice = formatPrice(rawPriceOrString || 500);
    if (modalPrice) modalPrice.textContent = formattedPrice;

    if (modalWaBtn) {
        const orderText = encodeURIComponent(`Hello Mr.Artist, I would like to order this artwork/sample:\n*Name:* ${title || 'Artwork'}\n*Size/Format:* ${desc || ''}\n*Price:* ${formattedPrice} (${currentCurrency})\n\nPlease confirm availability and payment details.`);
        modalWaBtn.href = `https://wa.me/94722043235?text=${orderText}`;
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');
    document.body.style.overflow = 'hidden'; // Lock background scroll
};

window.closeImagePopup = function() {
    const modal = document.getElementById('image-popup-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = ''; // Unlock background scroll

    // Reset Zoom
    isLightboxZoomed = false;
    currentLightboxZoomScale = 1;
    const modalImg = document.getElementById('popup-modal-image');
    if (modalImg) modalImg.style.transform = `scale(1)`;
};

window.toggleLightboxZoom = function(forceZoomIn) {
    const modalImg = document.getElementById('popup-modal-image');
    const wrapper = document.getElementById('lightbox-img-wrapper');
    if (!modalImg) return;

    if (typeof forceZoomIn === 'boolean') {
        if (forceZoomIn) {
            currentLightboxZoomScale = Math.min(currentLightboxZoomScale + 0.4, 2.8);
            isLightboxZoomed = true;
        } else {
            currentLightboxZoomScale = Math.max(currentLightboxZoomScale - 0.4, 1);
            if (currentLightboxZoomScale <= 1) isLightboxZoomed = false;
        }
    } else {
        // Toggle on image click
        if (isLightboxZoomed) {
            currentLightboxZoomScale = 1;
            isLightboxZoomed = false;
        } else {
            currentLightboxZoomScale = 1.8;
            isLightboxZoomed = true;
        }
    }

    modalImg.style.transform = `scale(${currentLightboxZoomScale})`;

    if (wrapper) {
        if (isLightboxZoomed) {
            wrapper.classList.remove('cursor-zoom-in');
            wrapper.classList.add('cursor-zoom-out');
        } else {
            wrapper.classList.remove('cursor-zoom-out');
            wrapper.classList.add('cursor-zoom-in');
        }
    }
};

window.handleLightboxBackdropClick = function(event) {
    // If click was outside the lightbox card, close modal
    const card = document.getElementById('lightbox-card');
    if (card && !card.contains(event.target) && !event.target.closest('#btn-zoom-in') && !event.target.closest('#btn-zoom-out')) {
        closeImagePopup();
    }
};

// Keyboard escape key listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImagePopup();
    }
});

// ----------------- Quote Calculator -----------------
const priceTable = {
    'a4': 500,              // A4 size 300GSM board - 500 LKR
    'a3': 900,              // A3 size 300GSM board - 900 LKR
    'landscape-4mm': 2800,  // 12.5 x 24.5 in landscape 4mm (2600GSM) board - 2800 LKR
    'triptych-4mm': 3200,   // 12.5 x 18 in x3 portrait boards triptych 4mm (2600GSM) - 3200 LKR
    'custom': 500           // Customizable design, size & orientation (Base starting 500 LKR)
};

export function updateCalculatorDropdownLabels() {
    const select = document.getElementById('calc-format-select');
    if (select) {
        const optTrip = select.querySelector('option[value="triptych-4mm"]');
        const optLand = select.querySelector('option[value="landscape-4mm"]');
        const optA3 = select.querySelector('option[value="a3"]');
        const optA4 = select.querySelector('option[value="a4"]');
        const optCustom = select.querySelector('option[value="custom"]');

        if (optTrip) optTrip.textContent = `12.5 x 18" x3 Triptych 4mm Board (2600GSM) — ${formatPrice(3200)}`;
        if (optLand) optLand.textContent = `12.5 x 24.5" Landscape 4mm Board (2600GSM) — ${formatPrice(2800)}`;
        if (optA3) optA3.textContent = `A3 Size Fine Art Board (300GSM) — ${formatPrice(900)}`;
        if (optA4) optA4.textContent = `A4 Size Fine Art Board (300GSM) — ${formatPrice(500)}`;
        if (optCustom) optCustom.textContent = `Customizable Design, Size & Orientation — ${formatPrice(500, { prefix: 'From ', suffix: '+' })}`;
    }

    // Update Dropdown menu item badges
    const menu = document.getElementById('custom-dropdown-menu');
    if (menu) {
        const tripBadge = menu.querySelector('[data-value="triptych-4mm"] span.font-display');
        const landBadge = menu.querySelector('[data-value="landscape-4mm"] span.font-display');
        const a3Badge = menu.querySelector('[data-value="a3"] span.font-display');
        const a4Badge = menu.querySelector('[data-value="a4"] span.font-display');
        const customBadge = menu.querySelector('[data-value="custom"] span.font-display');

        if (tripBadge) tripBadge.textContent = formatPrice(3200);
        if (landBadge) landBadge.textContent = formatPrice(2800);
        if (a3Badge) a3Badge.textContent = formatPrice(900);
        if (a4Badge) a4Badge.textContent = formatPrice(500);
        if (customBadge) customBadge.textContent = formatPrice(500, { prefix: 'From ' });
    }

    // Update selected item trigger badge
    const activeVal = select ? select.value : 'triptych-4mm';
    const badgeEl = document.getElementById('selected-item-badge');
    if (badgeEl) {
        badgeEl.textContent = formatPrice(priceTable[activeVal] || 500);
    }
}

window.calculateQuote = function() {
    const formatSelect = document.getElementById('calc-format-select');
    const qtyInput = document.getElementById('calc-qty-input');
    const upscaleCheck = document.getElementById('calc-upscale-check');
    const customCheck = document.getElementById('calc-custom-check');

    if (!formatSelect || !qtyInput) return;

    const format = formatSelect.value; 
    const qty = Math.max(1, parseInt(qtyInput.value) || 1);

    let unitPrice = priceTable[format] || 500;

    // Additional charge for Photo AI Upscaling (+500 LKR)
    if (upscaleCheck && upscaleCheck.checked) {
        unitPrice += 500;
    }

    // Additional charge for Bespoke Redesign / Custom Art Concept (+500 LKR)
    if (customCheck && customCheck.checked) {
        unitPrice += 500;
    }

    const subtotalLKR = unitPrice * qty;
    const deliveryLKR = 450;
    const totalLKR = subtotalLKR + deliveryLKR;

    const estimateTag = document.getElementById('calc-total-tag');
    if (estimateTag) {
        estimateTag.textContent = formatPrice(totalLKR);
    }

    const subtotalTag = document.getElementById('calc-subtotal-tag');
    if (subtotalTag) {
        if (currentCurrency === 'USD') {
            subtotalTag.textContent = `${formatPrice(subtotalLKR)} + ${formatPrice(deliveryLKR)} delivery`;
        } else {
            subtotalTag.textContent = `LKR ${subtotalLKR.toLocaleString()} + LKR ${deliveryLKR} island-wide delivery`;
        }
    }
};

window.sendCustomQuoteOrder = function() {
    const formatSelect = document.getElementById('calc-format-select');
    const qtyInput = document.getElementById('calc-qty-input');
    const notesInput = document.getElementById('calc-notes-input');
    const upscaleCheck = document.getElementById('calc-upscale-check');
    const customCheck = document.getElementById('calc-custom-check');
    const totalTag = document.getElementById('calc-total-tag');

    const formatText = formatSelect ? formatSelect.options[formatSelect.selectedIndex].text : 'Wall Art Board';
    const qty = qtyInput ? qtyInput.value : '1';
    
    let services = [];
    if (upscaleCheck && upscaleCheck.checked) services.push(`Photo AI Upscaling (+${formatPrice(500)})`);
    if (customCheck && customCheck.checked) services.push(`Custom Art / Redesign (+${formatPrice(500)})`);
    const servicesText = services.length > 0 ? services.join(', ') : 'Standard Catalog Artwork';

    const notes = notesInput && notesInput.value.trim() ? notesInput.value.trim() : 'None';
    const total = totalTag ? totalTag.textContent : formatPrice(3650);

    const message = `Hello Mr.Artist! 🎨
I would like to place a custom order inquiry:

• Product / Board Format: ${formatText}
• Quantity: ${qty}
• Currency: ${currentCurrency}
• Custom Services: ${servicesText}
• Special Notes: ${notes}
• Estimated Total: ${total}

Please guide me on sending high-res images and finalizing the order. Thank you!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/94722043235?text=${encoded}`, '_blank');
};

// ----------------- Symmetrical Quantity Stepper Controller -----------------
window.changeQty = function(delta) {
    const qtyInput = document.getElementById('calc-qty-input');
    if (!qtyInput) return;
    let val = parseInt(qtyInput.value) || 1;
    val = Math.max(1, Math.min(99, val + delta));
    qtyInput.value = val;
    window.calculateQuote();
};

// ----------------- Custom Luxury Dropdown Controller -----------------
window.toggleCustomDropdown = function() {
    const menu = document.getElementById('custom-dropdown-menu');
    const arrow = document.getElementById('custom-dropdown-arrow');
    if (!menu) return;

    const isOpen = menu.classList.contains('opacity-100');
    if (isOpen) {
        menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        menu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
        menu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
};

window.selectCustomOption = function(value, title, subtitle, rawPrice, icon) {
    const select = document.getElementById('calc-format-select');
    const titleEl = document.getElementById('selected-item-title');
    const subEl = document.getElementById('selected-item-subtitle');
    const badgeEl = document.getElementById('selected-item-badge');
    const iconEl = document.getElementById('selected-item-icon');

    if (select) {
        select.value = value;
    }
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    if (badgeEl) badgeEl.textContent = formatPrice(priceTable[value] || rawPrice || 500);
    if (iconEl) iconEl.className = `fa-solid ${icon}`;

    window.toggleCustomDropdown();
    window.calculateQuote();
};

// Close custom dropdown on outside click
document.addEventListener('click', (e) => {
    const container = document.getElementById('custom-dropdown-container');
    const menu = document.getElementById('custom-dropdown-menu');
    const arrow = document.getElementById('custom-dropdown-arrow');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
});

// ----------------- Three.js Ambient Particle Background (Light Theme) -----------------
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 80;
        mouseY = (e.clientY - window.innerHeight / 2) / 80;
    }, { passive: true });
}

function initThreeCanvas() {
    const container = document.getElementById('three-ambient-canvas');
    if (!container) return;

    try {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 35;

        const isMobile = window.innerWidth < 768;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const count = isMobile ? 80 : 200;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorTerracotta = new THREE.Color('#C85A32');
        const colorOchre = new THREE.Color('#D89258');
        const colorCharcoal = new THREE.Color('#887D75');

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

            const rand = Math.random();
            let c = colorTerracotta;
            if (rand > 0.6) c = colorOchre;
            else if (rand > 0.3) c = colorCharcoal;

            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.PointsMaterial({
            size: 1.4,
            map: texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            depthWrite: false
        });

        particles = new THREE.Points(geom, mat);
        scene.add(particles);

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            if (particles) {
                particles.rotation.y = elapsed * 0.015;
                particles.rotation.x = elapsed * 0.008;
            }

            targetX += (mouseX - targetX) * 0.04;
            targetY += (mouseY - targetY) * 0.04;
            camera.position.x = targetX;
            camera.position.y = -targetY;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            if (!renderer || !camera) return;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, { passive: true });

    } catch (err) {
        console.warn("Ambient visual canvas fallback:", err);
    }
}

// ----------------- Preloader Dismissal -----------------
function dismissPreloader() {
    const preloader = document.getElementById('page-preloader');
    if (!preloader) return;

    // Smooth fade out after brand logo introduction
    setTimeout(() => {
        preloader.classList.add('loaded');
        setTimeout(() => {
            preloader.remove();
        }, 650);
    }, 850);
}

// ----------------- Printed Samples Showcase -----------------
function renderLoadedSamples() {
    const grid = document.getElementById('samples-grid');
    if (!grid) return;

    if (showcaseSamples.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-[#888888] text-sm">
            <p>Loading printed showcase samples...</p>
        </div>`;
        return;
    }

    grid.innerHTML = '';

    // Show latest 7 products
    const displayedSamples = showcaseSamples.slice(0, 7);

    displayedSamples.forEach(sample => {
        const priceDisplay = formatPrice(sample.rawPrice || sample.price || 2800);
        const card = document.createElement('div');
        card.className = "glass-card rounded-3xl overflow-hidden border border-[#E8E3D9] hover:border-[#C85A32]/40 transition-all duration-300 shadow-soft flex flex-col justify-between group bg-white/90";
        
        const waMsg = encodeURIComponent(`Hello Mr.Artist! 🎨\nI would like to order this printed sample:\n• Title: ${sample.name}\n• Format: ${sample.size}\n• Price: ${priceDisplay}\n\nPlease confirm delivery details. Thank you!`);
        const waLink = `https://wa.me/94722043235?text=${waMsg}`;

        card.innerHTML = `
            <!-- Image Frame -->
            <div class="relative w-full aspect-[4/3] bg-[#F5F2EB] overflow-hidden">
                <img src="${sample.src}" alt="${sample.name}" class="sample-image-trigger w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer">
                
                <!-- Format Badge -->
                <div class="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-full border border-[#E8E3D9] text-[10px] font-bold text-[#1E1E1E] shadow-2xs pointer-events-none">
                    ${sample.size}
                </div>

                <!-- Price Badge -->
                <div class="absolute top-3 right-3 px-3 py-1 bg-[#FBF2ED] rounded-full border border-[#C85A32]/25 text-[11px] font-bold text-[#C85A32] shadow-2xs pointer-events-none">
                    ${priceDisplay}
                </div>

                <!-- Quick View Overlay -->
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span class="px-3.5 py-1.5 bg-white/95 rounded-full text-xs font-bold text-[#1E1E1E] shadow-sm flex items-center gap-1.5">
                        <i class="fa-solid fa-arrow-up-right-from-square text-[#C85A32]"></i> View Product Page
                    </span>
                </div>
            </div>

            <!-- Info & Order Button -->
            <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="sample-title-trigger font-serif font-bold text-base text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors line-clamp-1 cursor-pointer">${sample.name}</h4>
                    <p class="text-xs text-[#666666] mt-0.5">${sample.size}</p>
                </div>

                <div class="space-y-2 pt-1">
                    <a href="product.html?id=${sample.id}&type=sample" class="w-full py-2 bg-white hover:bg-[#FBF2ED] text-[#222222] hover:text-[#C85A32] font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 border border-[#E8E3D9]">
                        <i class="fa-solid fa-eye text-[11px] text-[#C85A32]"></i>
                        <span>View Piece Details</span>
                    </a>
                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 bg-[#FBF2ED] hover:bg-[#C85A32] text-[#C85A32] hover:text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 border border-[#C85A32]/25">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>Direct Order (${priceDisplay})</span>
                    </a>
                </div>
            </div>
        `;

        // Direct navigation to dedicated product page when clicking image or title
        const imgTrigger = card.querySelector('.sample-image-trigger');
        if (imgTrigger) {
            imgTrigger.addEventListener('click', () => {
                window.location.href = `product.html?id=${encodeURIComponent(sample.id)}&type=sample`;
            });
        }

        const titleTrigger = card.querySelector('.sample-title-trigger');
        if (titleTrigger) {
            titleTrigger.addEventListener('click', () => {
                window.location.href = `product.html?id=${encodeURIComponent(sample.id)}&type=sample`;
            });
        }

        grid.appendChild(card);
    });

    // 8th Card: "View More Samples" Luxury Action Card
    const viewMoreCard = document.createElement('a');
    viewMoreCard.href = "samples.html";
    viewMoreCard.className = "glass-card rounded-3xl overflow-hidden border-2 border-dashed border-[#C85A32]/40 hover:border-[#C85A32] transition-all duration-300 shadow-soft flex flex-col justify-between p-6 text-center group bg-[#FBF2ED]/50 hover:bg-[#FBF2ED] min-h-[380px]";
    viewMoreCard.innerHTML = `
        <div class="space-y-4 my-auto">
            <div class="w-16 h-16 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] group-hover:bg-[#C85A32] group-hover:text-white flex items-center justify-center mx-auto text-2xl transition-all duration-300 shadow-2xs group-hover:scale-110">
                <i class="fa-solid fa-layer-group"></i>
            </div>
            <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#C85A32] bg-white px-3 py-1 rounded-full border border-[#C85A32]/20 inline-block shadow-2xs">Complete Archive</span>
                <h4 class="font-serif text-xl font-bold text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors">Explore All Printed Samples</h4>
                <p class="text-xs text-[#666666] leading-relaxed max-w-[220px] mx-auto">Browse full gallery with format filters, live dimensions & search.</p>
            </div>
        </div>
        <div class="w-full py-3 bg-[#C85A32] group-hover:bg-[#B04A25] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-xs flex items-center justify-center gap-2">
            <span>View All Samples (${showcaseSamples.length}+)</span>
            <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
        </div>
    `;
    grid.appendChild(viewMoreCard);
}

async function loadAndRenderSamples() {
    showcaseSamples = await fetchSamples();
    renderLoadedSamples();
}

// ----------------- Initialization on DOM Load -----------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Detect & set initial currency (Auto-detect location or read saved preference)
    const initialCurrency = detectUserCurrency();
    window.setCurrency(initialCurrency);

    // 2. Fetch live artworks from Supabase (or fallback)
    galleryArtworks = await fetchArtworks();
    filteredArtworks = [...galleryArtworks];

    // 3. Render Gallery with loaded artworks
    filterGallery('all');

    // 4. Load & Render Printed Samples Showcase
    await loadAndRenderSamples();

    // 5. Init Quote Calculator
    calculateQuote();

    // 6. Init Three.js Background
    setTimeout(initThreeCanvas, 100);

    // 7. Dismiss preloader
    dismissPreloader();
});


// ----------------- Custom Design Order Desk Logic -----------------
const customSubjectNames = {
    'vehicle': 'Supercar / Vehicle Spec Poster',
    'anime': 'Anime & Manga Aesthetic Poster',
    'gaming': 'Gaming & Superhero Art Poster',
    'portrait': 'Personal / Bespoke Portrait Poster'
};

const customFormatDetails = {
    'landscape-4mm': { name: '12.5 x 24.5" Landscape (4mm Rigid Board)', price: 2800 },
    'triptych-4mm': { name: '12.5 x 18" x3 Triptych Set (4mm Rigid Board)', price: 3200 },
    'a3': { name: 'A3 Size Fine Art Board (300GSM)', price: 900 },
    'a4': { name: 'A4 Size Fine Art Board (300GSM)', price: 500 }
};

let activeCustomSubjectKey = 'vehicle';
let activeCustomFormatKey = 'landscape-4mm';

window.setCustomSubject = function(subjKey) {
    activeCustomSubjectKey = subjKey;
    document.querySelectorAll('.custom-subj-btn').forEach(btn => {
        const key = btn.getAttribute('data-subj');
        if (key === subjKey) {
            btn.className = "custom-subj-btn px-3 py-2.5 rounded-xl text-xs font-bold bg-[#FBF2ED] border-2 border-[#C85A32] text-[#C85A32] text-left transition shadow-2xs flex items-center gap-2";
        } else {
            btn.className = "custom-subj-btn px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E8E3D9] text-[#666] text-left hover:text-[#222] transition flex items-center gap-2";
        }
    });
};

window.setCustomFormat = function(formatKey) {
    activeCustomFormatKey = formatKey;
    document.querySelectorAll('.custom-fmt-card').forEach(card => {
        const fmt = card.getAttribute('data-custom-fmt');
        const dot = card.querySelector('.custom-fmt-dot');
        const dotBorder = dot ? dot.parentElement : null;
        const priceLabel = card.querySelector('.font-display');

        if (fmt === formatKey) {
            card.classList.add('border-[#C85A32]', 'bg-[#FBF2ED]', 'text-[#C85A32]');
            card.classList.remove('border-[#E8E3D9]', 'bg-white', 'text-[#222222]');
            if (dot) {
                dot.classList.remove('bg-transparent');
                dot.classList.add('bg-[#C85A32]');
            }
            if (dotBorder) {
                dotBorder.classList.remove('border-[#BBB]');
                dotBorder.classList.add('border-[#C85A32]');
            }
            if (priceLabel) {
                priceLabel.classList.add('text-[#C85A32]');
                priceLabel.classList.remove('text-[#222]');
            }
        } else {
            card.classList.remove('border-[#C85A32]', 'bg-[#FBF2ED]', 'text-[#C85A32]');
            card.classList.add('border-[#E8E3D9]', 'bg-white', 'text-[#222222]');
            if (dot) {
                dot.classList.add('bg-transparent');
                dot.classList.remove('bg-[#C85A32]');
            }
            if (dotBorder) {
                dotBorder.classList.add('border-[#BBB]');
                dotBorder.classList.remove('border-[#C85A32]');
            }
            if (priceLabel) {
                priceLabel.classList.remove('text-[#C85A32]');
                priceLabel.classList.add('text-[#222]');
            }
        }
    });

    calculateCustomQuote();
};

window.calculateCustomQuote = function() {
    const totalEl = document.getElementById('custom-quote-total');
    const breakdownEl = document.getElementById('custom-quote-breakdown');
    if (!totalEl || !breakdownEl) return;

    const fmtInfo = customFormatDetails[activeCustomFormatKey] || customFormatDetails['landscape-4mm'];
    const basePrice = fmtInfo.price;
    const delivery = 450;
    const total = basePrice + delivery;

    if (typeof formatPrice === 'function') {
        totalEl.textContent = formatPrice(total);
        breakdownEl.textContent = formatPrice(basePrice) + ' print + ' + formatPrice(delivery) + ' delivery';
    } else {
        totalEl.textContent = 'LKR ' + total.toLocaleString();
        breakdownEl.textContent = 'LKR ' + basePrice.toLocaleString() + ' print + LKR ' + delivery + ' delivery';
    }
};

window.sendCustomDesignWhatsAppRequest = function() {
    const subjectInput = document.getElementById('custom-subject-input');
    const totalEl = document.getElementById('custom-quote-total');

    const subjectTitle = customSubjectNames[activeCustomSubjectKey] || 'Custom Spec Poster';
    const subjectDetail = subjectInput && subjectInput.value.trim() ? subjectInput.value.trim() : 'Custom Poster Reference';
    const fmtInfo = customFormatDetails[activeCustomFormatKey] || customFormatDetails['landscape-4mm'];
    const total = totalEl ? totalEl.textContent : 'LKR 3,250';

    const message = 'Hello Ganusha / Mr.Artist! 🎨\n' +
'I would like to request a Custom Graphic Design & Print:\n\n' +
'• Category: ' + subjectTitle + '\n' +
'• Subject / Title: ' + subjectDetail + '\n' +
'• Print Format: ' + fmtInfo.name + '\n' +
'• Estimated Print Quote: ' + total + '\n\n' +
'I have photos / references ready. Please let me know how we can proceed with the design!';

    window.open('https://wa.me/94722043235?text=' + encodeURIComponent(message), '_blank');
};
