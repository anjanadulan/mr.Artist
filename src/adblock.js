// Strict Anti-Adblock Wall with Heavy Background Blur for Mr.Artist Studio
export function initAdBlockDetector() {
    if (typeof window === 'undefined') return;

    // Check after page loads
    window.addEventListener('load', () => {
        setTimeout(checkAdBlocker, 1200);
    });
}

function checkAdBlocker() {
    // Bait element check
    const bait = document.createElement('div');
    bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner adsbox adsbygoogle';
    bait.style.cssText = 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;';
    document.body.appendChild(bait);

    let isBlocked = false;
    const style = window.getComputedStyle(bait);
    if (style.display === 'none' || style.visibility === 'hidden' || bait.offsetParent === null || bait.offsetHeight === 0) {
        isBlocked = true;
    }

    // Secondary check: Test if AdSense request fails
    fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
            if (isBlocked) showAdBlockNotice();
        })
        .catch(() => {
            showAdBlockNotice();
        })
        .finally(() => {
            if (bait.parentNode) bait.parentNode.removeChild(bait);
        });
}

function showAdBlockNotice() {
    if (document.getElementById('adblock-notice-modal')) return;

    // Lock page scroll so user cannot bypass
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'adblock-notice-modal';
    overlay.className = 'fixed inset-0 z-[999999] flex items-center justify-center p-4 transition-all duration-500 opacity-0';
    overlay.style.cssText = 'background: rgba(15, 12, 10, 0.78); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);';
    
    overlay.innerHTML = `
        <div class="bg-[#FDFBF7] rounded-3xl p-7 sm:p-9 max-w-md w-full border border-[#E8E3D9] shadow-2xl text-center space-y-6 transform scale-95 transition-all duration-300 my-auto" onclick="event.stopPropagation()">
            
            <!-- Icon -->
            <div class="w-16 h-16 rounded-2xl bg-[#FBF2ED] text-[#C85A32] flex items-center justify-center mx-auto text-2xl shadow-2xs border border-[#C85A32]/20">
                <i class="fa-solid fa-shield-halved"></i>
            </div>

            <!-- Title & Description -->
            <div class="space-y-2.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#C85A32] bg-[#FBF2ED] px-3.5 py-1 rounded-full border border-[#C85A32]/20 inline-block shadow-2xs">AdBlocker Detected</span>
                <h3 class="font-serif text-2xl font-bold text-[#1E1E1E]">Please Disable AdBlocker to Access Site</h3>
                <p class="text-xs text-[#666666] leading-relaxed">
                    Mr.Artist Studio relies on non-intrusive ads to keep our fine art catalog, custom poster designer, and quote calculators 100% free to use.
                </p>
            </div>

            <!-- 3 Simple Whitelist Steps -->
            <div class="bg-white rounded-2xl p-4 border border-[#E8E3D9] text-left space-y-2 text-xs text-[#444] shadow-2xs">
                <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-[#FBF2ED] text-[#C85A32] text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span>Click your AdBlock extension icon in the toolbar</span>
                </div>
                <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-[#FBF2ED] text-[#C85A32] text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span>Turn OFF blocking or choose <strong>"Pause on this site"</strong></span>
                </div>
                <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-[#FBF2ED] text-[#C85A32] text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                    <span>Click the button below to reload and view content</span>
                </div>
            </div>

            <!-- Reload Action Button -->
            <div class="pt-1">
                <button type="button" onclick="window.location.reload()" class="w-full py-4 bg-[#C85A32] hover:bg-[#B04A25] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer">
                    <i class="fa-solid fa-rotate-right text-xs"></i>
                    <span>I've Disabled AdBlock / Reload Page</span>
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        const box = overlay.querySelector('div');
        if (box) {
            box.classList.remove('scale-95');
            box.classList.add('scale-100');
        }
    }, 50);
}
