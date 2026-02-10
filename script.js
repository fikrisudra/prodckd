/**
 * MYPRODUCTION TERMINAL - Final Optimized Script (With Fixed Hash)
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode, currentTabIndex = 0, touchStartX = 0;

// --- 1. FUNGSI HASH (SHA-256) ---
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Mengubah buffer menjadi string hexadecimal
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- 2. FUNGSI PINDAH TAB & PILL STABILIZER ---
function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    const targetEl = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    items.forEach(item => item.classList.remove('active'));
    targetEl.classList.add('active');

    requestAnimationFrame(() => {
        setTimeout(() => {
            if (pill && targetEl) {
                pill.style.width = `${targetEl.offsetWidth}px`;
                pill.style.left = `${targetEl.offsetLeft}px`;
            }
        }, 150); 
    });

    index === 1 ? startScanner() : stopScanner();
}

// --- 3. LOGIKA SWIPE (Anti-Input Interference) ---
document.addEventListener('touchstart', e => {
    if (e.target.closest('input') || e.target.closest('button') || e.target.closest('form')) {
        touchStartX = 0;
        return;
    }
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (touchStartX === 0) return;
    const touchEndX = e.changedTouches[0].screenX;
    const distance = touchStartX - touchEndX;
    const threshold = 80;

    if (Math.abs(distance) > threshold) {
        if (distance > 0 && currentTabIndex < 2) moveTab(currentTabIndex + 1);
        else if (distance < 0 && currentTabIndex > 0) moveTab(currentTabIndex - 1);
    }
    touchStartX = 0;
}, { passive: true });

// --- 4. AUTH & INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    const isMainPage = !!document.getElementById('mainSlider');

    if (session && isMainPage) {
        document.getElementById('userName').innerText = session.name;
        if(document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if(document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        setTimeout(() => moveTab(0), 400);
    } else if (!session && isMainPage) {
        window.location.href = 'index.html';
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const id = document.getElementById('userId').value.trim(); // Trim spasi
            const pass = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';

            try {
                // PROSES HASH SEBELUM KIRIM
                const hashedPass = await hashPassword(pass);
                
                // Gunakan mode no-cors jika perlu, tapi idealnya GAS sudah return JSON yang benar
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id, password: hashedPass })
                });

                const res = await response.json();
                
                if (res.status === 'success') {
                    res.id = id;
                    localStorage.setItem('userSession', JSON.stringify(res));
                    window.location.href = 'main.html';
                } else {
                    alert('Gagal: ' + (res.message || 'ID atau Password salah. Pastikan data di Sheets sudah berupa hash SHA-256.'));
                    btn.disabled = false;
                    btn.innerText = 'Sign In';
                }
            } catch (err) {
                console.error(err);
                alert('Koneksi Error: Pastikan Script URL benar dan akses diset ke "Anyone".');
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }
});

// --- 5. QR SCANNER & LOGOUT ---
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (!html5QrCode.isScanning) {
        html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 200 }, (text) => {
            document.getElementById('res-text').innerText = text;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(50);
            stopScanner();
        }).catch(() => {});
    }
}
function stopScanner() { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop(); }
function restartScanner() { document.getElementById('scanned-result').classList.add('hidden'); startScanner(); }
function logout() { localStorage.removeItem('userSession'); window.location.href = 'index.html'; }
