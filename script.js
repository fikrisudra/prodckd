/**
 * MYPRODUCTION TERMINAL - Core Script
 * Versi: 2.0 (Seamless Edition)
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;
let currentTabIndex = 0;
let touchStartX = 0;

// --- 1. KEAMANAN & SESI ---

/**
 * Mengubah password menjadi hash SHA-256 (opsional, tergantung backend)
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// --- 2. NAVIGASI SPA & PILL STABILIZER ---

/**
 * Pindah Tab dengan kalkulasi dimensi Pill yang presisi
 */
function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    const targetEl = el || items[index];

    // Geser Konten Utama
    if (slider) {
        slider.style.transform = `translateX(-${index * 100}vw)`;
    }

    // Update State Navigasi
    items.forEach(item => item.classList.remove('active'));
    targetEl.classList.add('active');

    // MENGUNCI UKURAN PILL: 
    // Menggunakan requestAnimationFrame agar kalkulasi lebar dilakukan 
    // tepat saat browser sedang merender transisi teks (span).
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (pill && targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const parentRect = targetEl.parentElement.getBoundingClientRect();
                
                // Set lebar dan posisi pill berdasarkan elemen target
                pill.style.width = `${targetEl.offsetWidth}px`;
                pill.style.left = `${targetEl.offsetLeft}px`;
            }
        }, 150); // Jeda 150ms sangat krusial agar pill tidak "kedip" saat teks melebar
    });

    // Manajemen Kamera Otomatis
    index === 1 ? startScanner() : stopScanner();
}

// --- 3. SWIPE GESTURE (DETEKSI GESER JARI) ---

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const distance = touchStartX - touchEndX;
    const threshold = 70; // Sensitivitas geser (dalam pixel)

    if (Math.abs(distance) > threshold) {
        // Geser ke Kiri (Pindah ke Tab Kanan)
        if (distance > 0 && currentTabIndex < 2) {
            moveTab(currentTabIndex + 1);
        } 
        // Geser ke Kanan (Pindah ke Tab Kiri)
        else if (distance < 0 && currentTabIndex > 0) {
            moveTab(currentTabIndex - 1);
        }
    }
}, { passive: true });

// --- 4. QR SCANNER (HTML5-QRCODE) ---

function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    
    if (!html5QrCode.isScanning) {
        const config = { 
            fps: 20, 
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0 
        };

        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
                document.getElementById('res-text').innerText = decodedText;
                document.getElementById('scanned-result').classList.remove('hidden');
                if(navigator.vibrate) navigator.vibrate(70); // Feedback getar
                stopScanner();
            }
        ).catch(err => console.warn("Menunggu izin kamera..."));
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

// --- 5. INITIAL LOAD & AUTH LOGIC ---

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    // Proteksi Halaman
    if (!session && page === 'main.html') {
        window.location.href = 'index.html';
        return;
    }

    // A. Logika Halaman Utama (main.html)
    if (session && page === 'main.html') {
        // Update UI dengan data sesi
        if (document.getElementById('userName')) {
            document.getElementById('userName').innerText = session.name;
            document.getElementById('userRole').innerText = session.role || 'Operator';
            document.getElementById('profileName').innerText = session.name;
            document.getElementById('profileID').innerText = 'ID: ' + (session.id || '-');
        }

        // Inisialisasi Pill di posisi awal (Tab 0)
        setTimeout(() => moveTab(0), 400);
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
            if(msg) msg.classList.add('hidden');

            const id = document.getElementById('userId').value;
            const pass = document.getElementById('password').value;

            try {
                // Catatan: Anda bisa membungkus 'pass' dengan hashPassword(pass) jika backend butuh hash
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: pass })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    result.id = id;
                    localStorage.setItem('userSession', JSON.stringify(result));
                    window.location.href = 'main.html';
                } else {
                    if(msg) {
                        msg.innerText = result.message || "ID atau Password Salah";
                        msg.classList.remove('hidden');
                    }
                    btn.disabled = false;
                    btn.innerHTML = 'Sign In <i class="fa-solid fa-chevron-right" style="margin-left:8px"></i>';
                }
            } catch (error) {
                alert("Koneksi gagal. Periksa sinyal internet Anda.");
                btn.disabled = false;
                btn.innerHTML = 'Sign In';
            }
        });
    }
});
