// GANTI DENGAN URL WEB APP TERBARU ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec
'; 
const SCRIPT_URL_CHECKLIST = 'https://script.google.com/macros/s/AKfycbw8ARR82VDxfd84YNhu3V-hxOWFsl-gMK4cHMBoW5Fy3pgucZHrzJuWAt0FJ0NMtMAr/exec'; 

let html5QrCode;

// --- 1. FUNGSI HASHING SHA-256 ---
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- 2. SISTEM NOTIFIKASI TOAST ---
function showToast(title, message, type = 'default') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    let icon = type === 'error' ? 'ri-error-warning-line' : (type === 'success' ? 'ri-checkbox-circle-line' : 'ri-information-line');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icon}"></i><div class="toast-content"><p>${title}</p><span>${message}</span></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- 3. LOGIKA LOGIN ---
async function handleLogin(e) {
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
            localStorage.setItem('userSession', JSON.stringify({ name: res.name, id: idInput.value, role: res.role }));
            showToast("Sukses", "Selamat datang " + res.name, "success");
            setTimeout(() => window.location.href = 'main.html', 1000);
        } else {
            showToast("Ditolak", "ID atau PIN Salah", "error");
            btn.disabled = false;
            btn.innerText = 'VERIFIKASI AKSES';
        }
    } catch (err) {
        showToast("Error", "Gagal terhubung ke server", "error");
        btn.disabled = false;
        btn.innerText = 'VERIFIKASI AKSES';
    }
}

// --- 4. LOGIKA APPROVAL ---
async function loadPendingChecklist() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align:center; padding:40px;"><i class="ri-loader-4-line ri-spin" style="font-size:30px; color:var(--primary);"></i><p>Sinkronisasi data...</p></div>';

    try {
        const response = await fetch(`${SCRIPT_URL_CHECKLIST}?action=getPending&t=${Date.now()}`);
        const data = await response.json();

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="empty-state"><i class="ri-checkbox-circle-fill"></i><p>Semua laporan sudah disetujui!</p></div>';
            return;
        }

        listContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'approval-card';
            card.innerHTML = `
                <div class="card-top"><span>${item.tanggal}</span><span class="shift-badge">SHIFT ${item.shift}</span></div>
                <div class="card-user"><i class="ri-user-follow-line"></i><div class="user-details"><p>OPERATOR</p><h4>${item.operator}</h4></div></div>
                <button class="btn-approve-sm" onclick="approveChecklist(${item.rowId})">SETUJUI</button>`;
            listContainer.appendChild(card);
        });
    } catch (err) {
        listContainer.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat data.</p>';
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
        showToast("Berhasil", "Laporan telah disetujui", "success");
        setTimeout(loadPendingChecklist, 1000);
    } catch (err) {
        showToast("Gagal", "Kesalahan server", "error");
    }
}

// --- 5. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    if (document.getElementById('approval-list-container')) loadPendingChecklist();

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        // Role based menu filtering logic here...
    }
});

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
