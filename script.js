const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;
let currentScanResult = ""; // Menyimpan hasil pindai terbaru

// --- 1. SISTEM NOTIFIKASI TOAST ---
function showToast(title, message, type = 'default') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let icon = 'ri-information-line';
    if (type === 'error') icon = 'ri-error-warning-line';
    if (type === 'success') icon = 'ri-checkbox-circle-line';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-content">
            <p>${title}</p>
            <span>${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 2. FUNGSI HASH SHA-256 ---
async function hashPassword(str) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return str; 
    }
}

// --- 3. NAVIGASI TAB ---
function switchTab(target) {
    if (target === 'scan') return openScanner();

    const views = ['home', 'profile'];
    const navItems = document.querySelectorAll('.nav-item');

    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    
    navItems.forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById('view-' + target);
    const targetBtn = document.getElementById('btn-' + target);
    
    if (targetView) targetView.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');
}

// --- 4. LOGIKA SCANNER & HASIL ---
function openScanner() {
    const modal = document.getElementById('scanner-modal');
    if (modal) {
        modal.classList.add('active');
        resetScannerView(); // Mulai dari tampilan kamera
    }
}

function closeScanner() {
    const modal = document.getElementById('scanner-modal');
    if (modal) {
        modal.classList.remove('active');
        stopScanner();
    }
}

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    
    const config = { 
        fps: 25, 
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (text) => {
            if(navigator.vibrate) navigator.vibrate(100);
            currentScanResult = text;
            showScanResult(text);
        }
    ).catch(err => {
        showToast("Kesalahan Kamera", "Gagal mengakses kamera perangkat", "error");
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Gagal menghentikan kamera"));
    }
}

// Menampilkan hasil pindai di dalam modal
function showScanResult(text) {
    stopScanner(); // Matikan kamera agar hemat baterai
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('result-view').classList.remove('hidden');
    document.getElementById('scanned-data').innerText = text;

    // Cek apakah data adalah URL untuk tombol "BUKA"
    const btnOpen = document.getElementById('btn-open-link');
    if (text.startsWith('http')) {
        btnOpen.style.display = "flex";
    } else {
        btnOpen.style.display = "none";
    }
}

// Kembali ke tampilan kamera (Pindai Lagi)
function resetScannerView() {
    document.getElementById('result-view').classList.add('hidden');
    document.getElementById('scanner-view').classList.remove('hidden');
    startScanner();
}

// Fungsi Salin Data
function copyData() {
    navigator.clipboard.writeText(currentScanResult).then(() => {
        showToast("Tersalin", "Data berhasil disalin ke papan klip", "success");
    }).catch(() => {
        showToast("Gagal", "Tidak dapat menyalin data", "error");
    });
}

// Fungsi Buka Link
function openLink() {
    if (currentScanResult.startsWith('http')) {
        window.open(currentScanResult, '_blank');
    }
}

// --- 5. INISIALISASI & LOGIN ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        const nameEl = document.getElementById('userName');
        const profNameEl = document.getElementById('profileName');
        const profIdEl = document.getElementById('profileID');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.innerText = session.name;
        if (profNameEl) profNameEl.innerText = session.name;
        if (profIdEl) profIdEl.innerText = 'ID: ' + session.id;
        if (avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${session.name}&background=FF8C32&color=fff&bold=true`;
        }
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('loginBtn');
            const idInput = document.getElementById('userId');
            const passInput = document.getElementById('password');

            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> VERIFIKASI...';

            try {
                const hashedPass = await hashPassword(passInput.value);
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: idInput.value, password: hashedPass })
                });
                const res = await response.json();

                if (res.status === 'success') {
                    showToast("Akses Diterima", "Selamat datang, " + res.name, "success");
                    localStorage.setItem('userSession', JSON.stringify({ name: res.name, id: idInput.value }));
                    setTimeout(() => { window.location.href = 'main.html'; }, 1500);
                } else {
                    showToast("Akses Ditolak", "ID atau PIN yang Anda masukkan salah!", "error");
                    btn.disabled = false;
                    btn.innerText = 'VERIFIKASI AKSES';
                }
            } catch (err) {
                showToast("Kesalahan Server", "Silakan coba lagi beberapa saat lagi", "error");
                btn.disabled = false;
                btn.innerText = 'VERIFIKASI AKSES';
            }
        });
    }
});

// --- 6. LOGOUT ---
function logout() {
    showToast("Keluar", "Menghapus sesi sesi login...", "default");
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'index.html';
    }, 1000);
}
