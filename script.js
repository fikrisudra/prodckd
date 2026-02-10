const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode; 
let currentTabIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// --- 1. Fungsi Keamanan (Hashing Password) ---
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- 2. Fungsi Logout ---
function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// --- 3. Logika Utama SPA Slider & Pill Navigation ---
function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    
    // Jika dipanggil dari swipe (el null), cari elemen navigasi berdasarkan index
    const targetEl = el || items[index];

    // Geser Konten Utama (Slider)
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;

    // Update State Navigasi
    items.forEach(item => item.classList.remove('active'));
    if (targetEl) targetEl.classList.add('active');

    // Geser Pill Background secara presisi
    if (pill && targetEl) {
        pill.style.width = `${targetEl.offsetWidth}px`;
        pill.style.left = `${targetEl.offsetLeft}px`;
    }

    // Manajemen Kamera Otomatis
    index === 1 ? startScanner() : stopScanner();
}

// --- 4. Fungsi Swipe Gesture (Geser Jari) ---
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 60; // Sensitivitas geseran
    const totalTabs = 3;

    // Geser ke Kiri (Pindah ke kanan)
    if (touchStartX - touchEndX > swipeThreshold) {
        if (currentTabIndex < totalTabs - 1) {
            moveTab(currentTabIndex + 1);
        }
    } 
    // Geser ke Kanan (Pindah ke kiri)
    else if (touchEndX - touchStartX > swipeThreshold) {
        if (currentTabIndex > 0) {
            moveTab(currentTabIndex - 1);
        }
    }
}

// --- 5. Fungsi Scanner (HTML5 QR Code) ---
function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    
    if (!html5QrCode.isScanning) {
        const config = { fps: 20, qrbox: 200 };
        html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
            document.getElementById('res-text').innerText = decodedText;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(70);
            stopScanner();
        }).catch(err => console.warn("Kamera ditunda atau error"));
    }
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Gagal stop kamera"));
    }
}

function restartScanner() {
    document.getElementById('scanned-result').classList.add('hidden');
    startScanner();
}

// --- 6. Logika Saat Halaman Dimuat ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    if (!session && page !== 'index.html') {
        window.location.href = 'index.html';
        return;
    }

    // A. Logika Halaman Utama (main.html)
    if (session && page === 'main.html') {
        const dataMap = {
            'userName': session.name,
            'userRole': session.role,
            'profileName': session.name,
            'profileID': 'ID: ' + (session.id || '-')
        };

        Object.keys(dataMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = dataMap[id];
        });

        // Inisialisasi Pill Posisi 0
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) {
            setTimeout(() => moveTab(0, activeItem), 300);
        }
    }

    // B. Logika Halaman Login (index.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (session) window.location.href = 'main.html';

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const msg = document.getElementById('message');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
            msg.classList.add('hidden');

            const id = document.getElementById('userId').value;
            const pass = document.getElementById('password').value;
            const hashedPass = await hashPassword(pass);

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: hashedPass })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    result.id = id;
                    localStorage.setItem('userSession', JSON.stringify(result));
                    window.location.href = 'main.html';
                } else {
                    msg.innerText = result.message || "ID atau Password Salah";
                    msg.classList.remove('hidden');
                    btn.disabled = false;
                    btn.innerText = 'Sign In';
                }
            } catch (error) {
                alert("Koneksi server gagal.");
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }
});
