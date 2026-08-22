import * as THREE from 'three';
import './style.css';
import { fetchArtworks, defaultArtworks, fetchSamples } from './supabase.js';

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
    if (carouselIndex === idx) {
        const art = filteredArtworks[idx];
        if (art) openImagePopup(art.src, art.name, art.desc, art.price);
    } else {
        carouselIndex = idx;
        updateCarouselVisuals();
    }
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
        if (priceEl) priceEl.textContent = activeArt.price;
        if (tagEl) tagEl.textContent = activeArt.tag;
    }
}

// ----------------- Interactive Zoom Lightbox Modal -----------------
let isLightboxZoomed = false;
let currentLightboxZoomScale = 1;

window.openImagePopup = function(src, title, desc, price) {
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

    if (modalPrice) modalPrice.textContent = price || 'LKR 500';

    if (modalWaBtn) {
        const orderText = encodeURIComponent(`Hello Mr.Artist, I would like to order this artwork/sample:\n*Name:* ${title || 'Artwork'}\n*Size/Format:* ${desc || ''}\n*Price:* ${price || ''}\n\nPlease confirm availability and payment details.`);
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
    'landscape-4mm': 2400,  // 12.5 x 24.5 in landscape 4mm (2600GSM) board - 2400 LKR
    'triptych-4mm': 2900,   // 12.5 x 18 in x3 portrait boards triptych 4mm (2600GSM) - 2900 LKR
    'custom': 500           // Customizable design, size & orientation (Base starting 500 LKR)
};

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

    const subtotal = unitPrice * qty;
    const delivery = 450;
    const total = subtotal + delivery;

    const estimateTag = document.getElementById('calc-total-tag');
    if (estimateTag) {
        estimateTag.textContent = `LKR ${total.toLocaleString()}`;
    }

    const subtotalTag = document.getElementById('calc-subtotal-tag');
    if (subtotalTag) {
        subtotalTag.textContent = `LKR ${subtotal.toLocaleString()} + LKR ${delivery} island-wide delivery`;
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
    if (upscaleCheck && upscaleCheck.checked) services.push('Photo AI Upscaling (+LKR 500)');
    if (customCheck && customCheck.checked) services.push('Custom Art / Redesign (+LKR 500)');
    const servicesText = services.length > 0 ? services.join(', ') : 'Standard Catalog Artwork';

    const notes = notesInput && notesInput.value.trim() ? notesInput.value.trim() : 'None';
    const total = totalTag ? totalTag.textContent : 'LKR 3,350';

    const message = `Hello Mr.Artist! 🎨
I would like to place a custom order inquiry:

• Product / Board Format: ${formatText}
• Quantity: ${qty}
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

window.selectCustomOption = function(value, title, subtitle, price, icon) {
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
    if (badgeEl) badgeEl.textContent = price;
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
async function loadAndRenderSamples() {
    const grid = document.getElementById('samples-grid');
    if (!grid) return;

    showcaseSamples = await fetchSamples();

    if (showcaseSamples.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center space-y-3 glass-card rounded-3xl p-8 max-w-md mx-auto">
                <div class="w-12 h-12 rounded-2xl bg-[#FBF2ED] text-[#C85A32] flex items-center justify-center mx-auto text-xl">
                    <i class="fa-solid fa-camera-retro"></i>
                </div>
                <h4 class="font-serif text-lg font-bold text-[#1E1E1E]">Real Samples Coming Soon</h4>
                <p class="text-xs text-[#666666]">New printed wall board setups will appear here directly as soon as they are uploaded from the studio manager.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = showcaseSamples.map(sample => {
        const orderText = encodeURIComponent(`Hello Mr.Artist, I would like to order this sample:\n*Name:* ${sample.name}\n*Size:* ${sample.size}\n*Price:* ${sample.price}\n\nPlease confirm availability!`);
        const waLink = `https://wa.me/94722043235?text=${orderText}`;

        return `
            <div class="glass-card rounded-3xl overflow-hidden border border-[#E8E3D9] hover:border-[#C85A32]/40 transition-all duration-300 shadow-soft flex flex-col justify-between group">
                <!-- Image Container -->
                <div class="relative w-full aspect-[4/3] bg-[#F5F2EB] overflow-hidden cursor-pointer" onclick="openImagePopup('${sample.src}', '${sample.name}', '${sample.size}', '${sample.price}')">
                    <img src="${sample.src}" alt="${sample.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    
                    <!-- Size Badge -->
                    <div class="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-[#E8E3D9] text-[10px] font-bold text-[#222222] shadow-2xs">
                        ${sample.size}
                    </div>

                    <!-- Price Badge -->
                    <div class="absolute top-3 right-3 px-3 py-1 bg-[#FBF2ED] rounded-full border border-[#C85A32]/25 text-[11px] font-bold text-[#C85A32] shadow-2xs">
                        ${sample.price}
                    </div>

                    <!-- Quick View Overlay -->
                    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="px-3.5 py-1.5 bg-white/95 rounded-full text-xs font-bold text-[#1E1E1E] shadow-sm flex items-center gap-1.5">
                            <i class="fa-solid fa-expand text-[#C85A32]"></i> Zoom
                        </span>
                    </div>
                </div>

                <!-- Info & Order Button -->
                <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-serif font-bold text-base text-[#1E1E1E] group-hover:text-[#C85A32] transition-colors line-clamp-1">${sample.name}</h4>
                        <p class="text-xs text-[#666666] mt-0.5">${sample.size}</p>
                    </div>

                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 bg-[#FBF2ED] hover:bg-[#C85A32] text-[#C85A32] hover:text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 border border-[#C85A32]/25">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>Order This (${sample.price})</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------- Initialization on DOM Load -----------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch live artworks from Supabase (or fallback)
    galleryArtworks = await fetchArtworks();
    filteredArtworks = [...galleryArtworks];

    // 2. Render Gallery with loaded artworks
    filterGallery('all');

    // 3. Load & Render Printed Samples Showcase
    loadAndRenderSamples();

    // 4. Init Quote Calculator
    calculateQuote();

    // 5. Init Three.js Background
    setTimeout(initThreeCanvas, 100);

    // 6. Dismiss preloader
    dismissPreloader();
});
