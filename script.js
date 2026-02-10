const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode, currentTabIndex = 0, touchStartX = 0;

async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-dest');
    const target = el || items[index];

    // Slide Page
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    // Switch Active State
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    // M3 Indicator Positioning (X axis only)
    if (pill) {
        const targetRect = target.getBoundingClientRect();
        const navRect = document.querySelector('.nav-bar-m3').getBoundingClientRect();
        const centerOffset = targetRect.left + (targetRect.width / 2) - (pill.offsetWidth / 2);
        pill.style.transform = `translateX(${centerOffset}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
}

// Swipe with M3 Easing
document.addEventListener('touchstart', e => {
    if (e.target.closest('input, button')) touchStartX = 0;
    else touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (touchStartX === 0) return;
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 100) {
        if (diff > 0 && currentTabIndex < 2) moveTab(currentTabIndex + 1);
        else if (diff < 0 && currentTabIndex > 0) moveTab(currentTabIndex - 1);
    }
}, { passive: true });

// Lifecycle
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    const isMain = !!document.getElementById('mainSlider');

    // Initial Nav Position
    if (isMain) setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const id = document.getElementById('userId').value.trim();
            const pass = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerHTML = 'Memproses...';

            try {
                const hp = await hashPassword(pass);
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ id, password: hp }) });
                const res = await response.json();
                
                if (res.status === 'success') {
                    res.id = id;
                    localStorage.setItem('userSession', JSON.stringify(res));
                    window.location.href = 'main.html';
                } else {
                    alert(res.message || 'ID/Password Salah');
                    btn.disabled = false;
                    btn.innerText = 'Masuk';
                }
            } catch (err) {
                alert('Gangguan Jaringan');
                btn.disabled = false;
                btn.innerText = 'Masuk';
            }
        });
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (!html5QrCode.isScanning) {
        html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
            document.getElementById('res-text').innerText = text;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(60);
            stopScanner();
        }).catch(() => {});
    }
}
function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
