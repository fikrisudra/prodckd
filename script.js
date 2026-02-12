const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec';
const SCRIPT_URL_CHECKLIST = 'https://script.google.com/macros/s/AKfycbwuTFEMWewveNwQD65r-z3Tna42eH0Ft5x2y1wofJctU31Odc53rWXO5LtLhvHBbTCC/exec';

let html5QrCode;

// --- 1. FUNGSI ENKRIPSI SHA-256 ---
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- 2. SISTEM NOTIFIKASI TOAST ---
function showToast(title, message, type = 'default') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    let icon = 'ri-information-line';
    if (type === 'error') icon = 'ri-error-warning-line';
    if (type === 'success') icon = 'ri-checkbox-circle-line';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icon}"></i><div class="toast-content"><p>${title}</p><span>${message}</span></div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 3. LOGIKA LOGIN DENGAN SHA-256 ---
async function handleLogin(e) {
    e.preventDefault(); 
    
    const btn = document.getElementById('loginBtn');
    const idInput = document.getElementById('userId');
    const passInput = document.getElementById('password');

    if (!idInput.value || !passInput.value) {
        showToast("Lengkapi Data", "ID dan PIN diperlukan", "error");
        return;
    }

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> VERIFIKASI...';

    try {
        // Proses Hashing PIN di sisi Client
        const hashedPassword = await hashPassword(passInput.value);
        
        const payload = { 
            id: idInput.value, 
            password: hashedPassword 
        };

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
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
            btn.innerText = originalText;
        }
    } catch (err) {
        console.error("Login Error:", err);
        showToast("Kesalahan Server", "Gagal terhubung ke database", "error");
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// --- 4. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Inisialisasi Data User & Menu
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if (document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${session.name}&background=FF8C32&color=fff&bold=true`;

        // Filter Menu berdasarkan Role
        const menuChecklist = document.getElementById('menu-checklist');
        const menuApproval = document.getElementById('menu-approval');
        if (menuChecklist && ['Control Panel Operator', 'Supervisor', 'Admin'].includes(session.role)) menuChecklist.classList.remove('hidden');
        if (menuApproval && ['Supervisor', 'Admin'].includes(session.role)) menuApproval.classList.remove('hidden');
    }

    // Jika di halaman Approval, muat data
    if (document.getElementById('approval-list-container')) {
        loadPendingChecklist();
    }
});

// --- FUNGSI LAINNYA (Approval, Logout, SwitchTab) TETAP SAMA ---
async function loadPendingChecklist() { /* ... kode sebelumnya ... */ }
async function approveChecklist(rowId) { /* ... kode sebelumnya ... */ }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
