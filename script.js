const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec';
// URL Script untuk Daily Checklist & Approval
const SCRIPT_URL_CHECKLIST = 'https://script.google.com/macros/s/AKfycbyXy1MagNpoBk5jzHPhcSfCMal3SwJ9AICPv_EEua7Kmt-rURHVexfLUBeqlpMYHmYo/exec';

let html5QrCode;
let currentScanResult = ""; 

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

// --- 4. LOGIKA SCANNER ---
function openScanner() {
    const modal = document.getElementById('scanner-modal');
    if (modal) {
        modal.classList.add('active');
        resetScannerView(); 
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
    const config = { fps: 25, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 };
    html5QrCode.start({ facingMode: "environment" }, config, (text) => {
        if(navigator.vibrate) navigator.vibrate(100);
        currentScanResult = text;
        showScanResult(text);
    }).catch(err => {
        showToast("Kesalahan Kamera", "Gagal mengakses kamera", "error");
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Gagal stop kamera"));
    }
}

function showScanResult(text) {
    stopScanner(); 
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('result-view').classList.remove('hidden');
    document.getElementById('scanned-data').innerText = text;
    const btnOpen = document.getElementById('btn-open-link');
    btnOpen.style.display = text.startsWith('http') ? "flex" : "none";
}

function resetScannerView() {
    document.getElementById('result-view').classList.add('hidden');
    document.getElementById('scanner-view').classList.remove('hidden');
    startScanner();
}

// --- 5. LOGIKA APPROVAL (NEW) ---
async function approveChecklist(rowId) {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (!session || !['Supervisor', 'Admin'].includes(session.role)) {
        return showToast("Akses Ditolak", "Hanya Supervisor yang bisa melakukan approval", "error");
    }

    if (!confirm("Setujui laporan ini?")) return;

    try {
        await fetch(SCRIPT_URL_CHECKLIST, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: "approveChecklist",
                rowId: rowId,
                supervisorName: session.name
            })
        });
        showToast("Berhasil", "Laporan disetujui", "success");
        // Reload list jika fungsi loadPendingChecklist tersedia di halaman tersebut
        if (typeof loadPendingChecklist === "function") loadPendingChecklist();
    } catch (err) {
        showToast("Gagal", "Kesalahan saat menyetujui laporan", "error");
    }
}

// --- 6. INISIALISASI & LOGIN ---
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

        // Tampilkan menu Checklist untuk Operator & Supervisor
        const menuChecklist = document.getElementById('menu-checklist');
        if (menuChecklist && ['Control Panel Operator', 'Supervisor', 'Admin'].includes(session.role)) {
            menuChecklist.classList.remove('hidden');
        }

        // Tampilkan menu Approval HANYA untuk Supervisor & Admin
        const menuApproval = document.getElementById('menu-approval');
        if (menuApproval && ['Supervisor', 'Admin'].includes(session.role)) {
            menuApproval.classList.remove('hidden');
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
                    localStorage.setItem('userSession', JSON.stringify({ 
                        name: res.name, 
                        id: idInput.value,
                        role: res.role 
                    }));
                    setTimeout(() => { window.location.href = 'main.html'; }, 1500);
                } else {
                    showToast("Akses Ditolak", "ID atau PIN salah!", "error");
                    btn.disabled = false;
                    btn.innerText = 'VERIFIKASI AKSES';
                }
            } catch (err) {
                showToast("Kesalahan Server", "Silakan coba lagi", "error");
                btn.disabled = false;
                btn.innerText = 'VERIFIKASI AKSES';
            }
        });
    }
});

// --- 7. LOGOUT ---
function logout() {
    showToast("Keluar", "Menghapus sesi login...", "default");
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'index.html';
    }, 1000);
}
