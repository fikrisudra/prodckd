const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// 1. Security: SHA-256 Hashing Engine
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. Navigation: Dynamic Pill Positioning
function moveTab(index, el) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const buttons = document.querySelectorAll('.nav-btn');

    // Geser Viewport
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    // Update State Tombol
    buttons.forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    // Kalkulasi Posisi Pill (Tepat di tengah tombol aktif)
    if (pill) {
        const pillWidth = pill.offsetWidth;
        const btnWidth = el.offsetWidth;
        const btnLeft = el.offsetLeft;
        
        // Menghitung titik tengah tombol dikurangi setengah lebar pill
        const centerPos = btnLeft + (btnWidth / 2) - (pillWidth / 2);
        pill.style.transform = `translateX(${centerPos}px)`;
    }

    // Kontrol Scanner: Hidupkan hanya di tab indeks 1
    index === 1 ? startScanner() : stopScanner();

    // Haptic Feedback (Vibrasi ringan ala Android)
    if(navigator.vibrate) navigator.vibrate(10);
}

// 3. Lifecycle & Events
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Posisi Navigasi saat pertama kali masuk Dashboard
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn && document.getElementById('navPill')) {
        setTimeout(() => moveTab(0, activeBtn), 200);
    }

    // Load Data Sesi User
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        const nameDisplay = document.getElementById('profileName');
        const idDisplay = document.getElementById('profileID');
        if (nameDisplay) nameDisplay.innerText = session.name;
        if (idDisplay) idDisplay.innerText = 'ID: ' + session.id;
    }

    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.innerText = 'VERIFYING...';

            try {
                const id = document.getElementById('userId').value.trim();
                const rawPass = document.getElementById('password').value;
                const hashedPass = await hashPassword(rawPass);

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: hashedPass })
                });
                const res = await response.json();

                if (res.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify({ name: res.name, id: id }));
                    window.location.href = 'main.html';
                } else {
                    alert('ID atau Password Salah');
                    btn.disabled = false;
                    btn.innerText = 'AUTHENTICATE';
                }
            } catch (err) {
                alert('Gagal terhubung ke server. Periksa koneksi internet.');
                btn.disabled = false;
                btn.innerText = 'AUTHENTICATE';
            }
        });
    }
});

// 4. Vision Engine (Scanner)
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    
    // Konfigurasi QR Box agar pas dengan scanner-frame di CSS
    const config = { 
        fps: 24, 
        qrbox: { width: 200, height: 200 },
        aspectRatio: 1.0 
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (text) => {
            const resText = document.getElementById('res-text');
            if (resText) {
                resText.innerText = text;
                resText.style.color = 'var(--primary-color)';
            }
            if(navigator.vibrate) navigator.vibrate([50, 30, 50]);
        }
    ).catch(() => {
        console.warn("Scanner failed to start. Camera may be in use.");
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Scanner stop error:", err));
    }
}

// 5. Session Control
function logout() {
    if (confirm("Sign out dari sesi ini?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
