const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec';
const SCRIPT_URL_CHECKLIST = 'https://script.google.com/macros/s/AKfycbwuTFEMWewveNwQD65r-z3Tna42eH0Ft5x2y1wofJctU31Odc53rWXO5LtLhvHBbTCC/exec';

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
    toast.innerHTML = `<i class="${icon}"></i><div class="toast-content"><p>${title}</p><span>${message}</span></div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 2. LOGIKA LOGIN (PERBAIKAN UTAMA) ---
async function handleLogin(e) {
    e.preventDefault(); // Mencegah halaman refresh dan data hilang
    
    const btn = document.getElementById('loginBtn');
    const idInput = document.getElementById('userId');
    const passInput = document.getElementById('password');

    if (!idInput.value || !passInput.value) {
        showToast("Lengkapi Data", "ID dan PIN tidak boleh kosong", "error");
        return;
    }

    // Simpan teks asli tombol
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> VERIFIKASI...';

    try {
        // Kita gunakan teks biasa dulu (tanpa hash) untuk memastikan koneksi lancar
        const payload = { 
            id: idInput.value, 
            password: passInput.value 
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
            showToast("Akses Ditolak", res.message || "ID atau PIN salah!", "error");
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

// --- 3. APPROVAL & DATA LOADING ---
async function loadPendingChecklist() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="ri-loader-4-line ri-spin" style="font-size:30px; color:var(--primary);"></i><p>Memuat data...</p></div>';

    try {
        const response = await fetch(`${SCRIPT_URL_CHECKLIST}?action=getPending`);
        const data = await response.json();

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="empty-state"><i class="ri-inbox-archive-line"></i><p>Semua laporan sudah disetujui!</p></div>';
            return;
        }

        listContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'approval-card animate-list';
            card.innerHTML = `
                <div class="card-top"><span class="date">${item.tanggal}</span><span class="shift-badge">SHIFT ${item.shift}</span></div>
                <div class="card-user"><i class="ri-user-follow-line"></i><div class="user-details"><p>OPERATOR</p><h4>${item.operator}</h4></div></div>
                <button class="btn-approve-sm" onclick="approveChecklist(${item.rowId})"><i class="ri-check-double-line"></i> SETUJUI LAPORAN</button>
            `;
            listContainer.appendChild(card);
        });
    } catch (err) {
        listContainer.innerHTML = '<p style="color:red; text-align:center;">Gagal mengambil data.</p>';
    }
}

async function approveChecklist(rowId) {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (!confirm("Setujui laporan ini?")) return;

    try {
        await fetch(SCRIPT_URL_CHECKLIST, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: "approveChecklist", rowId: rowId, supervisorName: session.name })
        });
        showToast("Berhasil", "Laporan disetujui", "success");
        setTimeout(() => { loadPendingChecklist(); }, 1000);
    } catch (err) {
        showToast("Gagal", "Kesalahan server", "error");
    }
}

// --- 4. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    // Handler untuk Form Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Muat data Approval jika di halaman approval
    if (document.getElementById('approval-list-container')) {
        loadPendingChecklist();
    }

    // Update UI berdasarkan session
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if (document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${session.name}&background=FF8C32&color=fff&bold=true`;

        const menuChecklist = document.getElementById('menu-checklist');
        const menuApproval = document.getElementById('menu-approval');
        if (menuChecklist && ['Control Panel Operator', 'Supervisor', 'Admin'].includes(session.role)) menuChecklist.classList.remove('hidden');
        if (menuApproval && ['Supervisor', 'Admin'].includes(session.role)) menuApproval.classList.remove('hidden');
    }
});

// --- 5. FUNGSI NAVIGASI & LAINNYA ---
function switchTab(target) {
    const views = ['home', 'profile'];
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const targetView = document.getElementById('view-' + target);
    const targetBtn = document.getElementById('btn-' + target);
    if (targetView) targetView.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- SCANNER LOGIC ---
function openScanner() { document.getElementById('scanner-modal').classList.add('active'); startScanner(); }
function closeScanner() { document.getElementById('scanner-modal').classList.remove('active'); stopScanner(); }
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        stopScanner();
        document.getElementById('scanner-view').classList.add('hidden');
        document.getElementById('result-view').classList.remove('hidden');
        document.getElementById('scanned-data').innerText = text;
    });
}
function stopScanner() { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop(); }
