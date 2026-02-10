const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode; // Global variable untuk scanner

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
function moveTab(index, el) {
    // Geser Konten Utama (Slider)
    const slider = document.getElementById('mainSlider');
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;

    // Update State Navigasi
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');

    // Geser Pill Background (Latar Oranye)
    const pill = document.getElementById('navPill');
    if (pill) {
        pill.style.width = `${el.offsetWidth}px`;
        pill.style.left = `${el.offsetLeft}px`;
    }

    // Manajemen Kamera Otomatis
    if (index === 1) { // Index 1 adalah tab Scan
        startScanner();
    } else {
        stopScanner();
    }
}

// --- 4. Fungsi Scanner (HTML5 QR Code) ---
function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    
    // Cegah kamera aktif ganda
    if (!html5QrCode.isScanning) {
        const config = { fps: 20, qrbox: 200 };
        html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
            // Berhasil Scan
            document.getElementById('res-text').innerText = decodedText;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(70); // Feedback getar
            stopScanner();
        }).catch(err => console.error("Kamera Error:", err));
    }
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Gagal stop kamera:", err));
    }
}

function restartScanner() {
    document.getElementById('scanned-result').classList.add('hidden');
    startScanner();
}

// --- 5. Logika Saat Halaman Dimuat ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    // Proteksi: Jika belum login, tendang ke index.html
    if (!session && page !== 'index.html') {
        window.location.href = 'index.html';
        return;
    }

    // A. Logika Halaman Utama (main.html)
    if (session && page === 'main.html') {
        // Tampilkan Data User ke UI
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

        // Inisialisasi Posisi Pill Pertama Kali (Home Aktif)
        const activeItem = document.querySelector('.nav-item.active');
        const pill = document.getElementById('navPill');
        if (activeItem && pill) {
            setTimeout(() => {
                pill.style.width = `${activeItem.offsetWidth}px`;
                pill.style.left = `${activeItem.offsetLeft}px`;
            }, 300); // Delay sedikit agar layout terhitung sempurna
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
                alert("Koneksi server gagal. Coba lagi.");
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }
});
