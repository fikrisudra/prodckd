// GANTI DENGAN URL WEB APP TERBARU ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec'; 
const SCRIPT_URL_CHECKLIST = 'https://script.google.com/macros/s/AKfycbyILXeN_2U_dRgJebukndZkEm6aN69TaWnMuJTRLhvExeAH469kdc14fljR16_h-41d/exec'; 

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

// --- 4. LOGIKA APPROVAL (Target Cell E) ---
async function loadPendingChecklist() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div style="text-align:center; padding:40px;">
            <i class="ri-loader-4-line ri-spin" style="font-size:30px; color:var(--primary);"></i>
            <p style="margin-top:10px; font-weight:700;">Sinkronisasi data...</p>
        </div>`;

    try {
        // action=getPending akan mencari data dengan status "Pending Approval" di Kolom E
        const response = await fetch(`${SCRIPT_URL_CHECKLIST}?action=getPending&t=${Date.now()}`);
        const data = await response.json();

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:40px; opacity:0.6;">
                    <i class="ri-checkbox-circle-fill" style="font-size:48px; color:var(--success);"></i>
                    <p style="margin-top:10px; font-weight:700;">Semua laporan sudah disetujui!</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'approval-card'; // Pastikan class ini ada di style.css
            card.style = "background: white; border-radius: 15px; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--primary);";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-size:12px; color:var(--text-sub); font-weight:600;">#ID-${item.rowId}</span>
                    <span style="font-size:11px; background:var(--bg); padding:2px 8px; border-radius:10px; font-weight:700;">SHIFT ${item.shift}</span>
                </div>
                <div style="margin-bottom:15px;">
                    <p style="font-size:11px; color:var(--text-sub); margin:0;">OPERATOR</p>
                    <h4 style="margin:0; font-size:16px;">${item.operator}</h4>
                    <p style="font-size:12px; margin-top:4px;"><i class="ri-calendar-line"></i> ${item.tanggal}</p>
                </div>
                <button class="btn-login" onclick="approveChecklist(${item.rowId})" style="padding:10px; font-size:12px; background:var(--success); width:100%;">
                    <i class="ri-check-double-line"></i> SETUJUI LAPORAN
                </button>`;
            listContainer.appendChild(card);
        });
    } catch (err) {
        listContainer.innerHTML = '<p style="text-align:center; color:red; padding:20px;">Gagal memuat data. Cek koneksi atau URL Script.</p>';
    }
}

async function approveChecklist(rowId) {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (!session) return showToast("Error", "Sesi berakhir, silakan login ulang", "error");
    
    if (!confirm("Konfirmasi Persetujuan untuk Baris #" + rowId + "?")) return;

    try {
        // Mengirimkan rowId agar GAS tahu baris mana yang diubah Statusnya di Kolom E
        await fetch(SCRIPT_URL_CHECKLIST, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ 
                action: "approveChecklist", 
                rowId: rowId, 
                supervisorName: session.name 
            })
        });
        
        showToast("Berhasil", "Laporan baris #" + rowId + " disetujui", "success");
        // Beri jeda 1 detik agar Spreadsheet selesai menulis sebelum list di-refresh
        setTimeout(loadPendingChecklist, 1000);
    } catch (err) {
        showToast("Gagal", "Kesalahan server", "error");
    }
}

// --- 5. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Otomatis load data jika elemen container ada (di halaman ApprovalList.html)
    if (document.getElementById('approval-list-container')) {
        loadPendingChecklist();
    }

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if (document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        
        // Filter Menu berdasarkan Role
        const menuChecklist = document.getElementById('menu-checklist');
        const menuApproval = document.getElementById('menu-approval');
        
        if (menuChecklist && ['Control Panel Operator', 'Supervisor', 'Admin'].includes(session.role)) {
            menuChecklist.classList.remove('hidden');
        }
        if (menuApproval && ['Supervisor', 'Admin'].includes(session.role)) {
            menuApproval.classList.remove('hidden');
        }
    }
});

function logout() { 
    localStorage.clear(); 
    window.location.href = 'index.html'; 
}
