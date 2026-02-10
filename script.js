const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode, currentTabIndex = 0, touchStartX = 0, touchEndX = 0;

function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    const targetEl = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    items.forEach(item => item.classList.remove('active'));
    targetEl.classList.add('active');

    // MENGUNCI UKURAN PILL: Tunggu hingga span teks melebar sempurna
    setTimeout(() => {
        if (pill && targetEl) {
            pill.style.width = `${targetEl.offsetWidth}px`;
            pill.style.left = `${targetEl.offsetLeft}px`;
        }
    }, 150); // Jeda 150ms sangat penting untuk stabilitas visual

    index === 1 ? startScanner() : stopScanner();
}

// Swipe Gesture
document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

function handleSwipe() {
    const threshold = 80;
    if (touchStartX - touchEndX > threshold && currentTabIndex < 2) moveTab(currentTabIndex + 1);
    else if (touchEndX - touchStartX > threshold && currentTabIndex > 0) moveTab(currentTabIndex - 1);
}

// Scanner
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (!html5QrCode.isScanning) {
        html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 200 }, (text) => {
            document.getElementById('res-text').innerText = text;
            document.getElementById('scanned-result').classList.remove('hidden');
            stopScanner();
        }).catch(() => {});
    }
}

function stopScanner() { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop(); }

// Auth & Load
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    if (session && page === 'main.html') {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'ID: ' + (session.id || '-');
        setTimeout(() => moveTab(0), 300);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm && !session) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true; btn.innerText = 'Authenticating...';
            
            const id = document.getElementById('userId').value;
            const pass = document.getElementById('password').value;
            // (Tambahkan fungsi hashPassword di sini jika diperlukan)
            
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ id, password: pass }) });
                const res = await response.json();
                if (res.status === 'success') {
                    res.id = id;
                    localStorage.setItem('userSession', JSON.stringify(res));
                    window.location.href = 'main.html';
                } else {
                    alert('Gagal login'); btn.disabled = false; btn.innerText = 'Sign In';
                }
            } catch { btn.disabled = false; }
        });
    }
});

function logout() { localStorage.removeItem('userSession'); window.location.href = 'index.html'; }
