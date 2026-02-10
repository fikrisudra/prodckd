const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode, currentTabIndex = 0, touchStartX = 0;

// Proper SHA-256 Hashing
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Seamless Tab Transition
function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-link');
    const target = el || items[index];

    // Slide Halaman
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    // Aktifkan Link
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    // Geser Pill tanpa Bounce/Resizing kasar
    if (pill) {
        pill.style.width = `${target.offsetWidth}px`;
        pill.style.transform = `translateX(${target.offsetLeft - 6}px)`; 
    }

    index === 1 ? startScanner() : stopScanner();
}

// Anti-Bounce Swipe Detection
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

// Lifecycle & Auth
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    const isMain = !!document.getElementById('mainSlider');

    if (session && isMain) {
        document.getElementById('userName').innerText = session.name;
        if(document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if(document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        setTimeout(() => moveTab(0), 300);
    } else if (!session && isMain) {
        window.location.href = 'index.html';
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const id = document.getElementById('userId').value.trim();
            const pass = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerText = 'Verifikasi...';

            try {
                const hp = await hashPassword(pass);
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ id, password: hp }) });
                const res = await response.json();
                
                if (res.status === 'success') {
                    res.id = id;
                    localStorage.setItem('userSession', JSON.stringify(res));
                    window.location.href = 'main.html';
                } else {
                    alert(res.message || 'Gagal Login');
                    btn.disabled = false;
                    btn.innerText = 'Masuk';
                }
            } catch (err) {
                alert('Gangguan Koneksi');
                btn.disabled = false;
                btn.innerText = 'Masuk';
            }
        });
    }
});

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
function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
