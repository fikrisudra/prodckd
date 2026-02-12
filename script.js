const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyI-8_yxAZjMGH59gnjzh1ooFaRVZplmlKsokQAcd9_B55MUCNlyiIqshY6H4eXkz-/exec';
// URL Script untuk Daily Checklist & Approval
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

// --- 2. FUNGSI AMBIL DATA PENDING (DIPERBAIKI) ---
async function loadPendingChecklist() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return; // Hanya jalan jika elemen ini ada (di ApprovalList.html)

    listContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="ri-loader-4-line ri-spin" style="font-size:30px; color:var(--primary);"></i><p>Memuat data...</p></div>';

    try {
        // Memanggil GAS dengan parameter action=getPending
        const response = await fetch(`${SCRIPT_URL_CHECKLIST}?action=getPending`);
        const data = await response.json();

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ri-inbox-archive-line"></i>
                    <p>Semua laporan sudah disetujui!</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = ''; // Hapus loading
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'approval-card animate-list';
            card.innerHTML = `
                <div class="card-top">
                    <span class="date">${item.tanggal}</span>
                    <span class="shift-badge">SHIFT ${item.shift}</span>
                </div>
                <div class="card-user">
                    <i class="ri-user-follow-line"></i>
                    <div class="user-details">
                        <p>OPERATOR</p>
                        <h4>${item.operator}</h4>
                    </div>
                </div>
                <button class="btn-approve-sm" onclick="approveChecklist(${item.rowId})">
                    <i class="ri-check-double-line"></i> SETUJUI LAPORAN
                </button>
            `;
            listContainer.appendChild(card);
        });
    } catch (err) {
        listContainer.innerHTML = '<p style="color:red; text-align:center;">Gagal mengambil data. Pastikan koneksi internet aktif.</p>';
        console.error("Error Load Data:", err);
    }
}

// --- 3. LOGIKA APPROVAL (DIPERBAIKI) ---
async function approveChecklist(rowId) {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (!session || !['Supervisor', 'Admin'].includes(session.role)) {
        return showToast("Akses Ditolak", "Hanya Supervisor yang diizinkan", "error");
    }

    if (!confirm("Konfirmasi persetujuan laporan ini?")) return;

    // Tambahkan loading overlay atau disable tombol agar tidak double click
    try {
        const response = await fetch(SCRIPT_URL_CHECKLIST, {
            method: 'POST',
            mode: 'no-cors', // Penting agar tidak kena CORS di Apps Script
            body: JSON.stringify({
                action: "approveChecklist",
                rowId: rowId,
                supervisorName: session.name
            })
        });

        showToast("Berhasil", "Laporan telah disetujui", "success");
        
        // Beri jeda sebentar lalu refresh list
        setTimeout(() => {
            loadPendingChecklist();
        }, 1000);
        
    } catch (err) {
        showToast("Gagal", "Terjadi kesalahan server", "error");
    }
}

// --- 4. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    
    // Jika berada di halaman Approval, muat data otomatis
    if (document.getElementById('approval-list-container')) {
        loadPendingChecklist();
    }

    if (session) {
        // Update UI Nama & Role
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if (document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        
        // Filter Menu
        const menuChecklist = document.getElementById('menu-checklist');
        const menuApproval = document.getElementById('menu-approval');
        
        if (menuChecklist && ['Control Panel Operator', 'Supervisor', 'Admin'].includes(session.role)) {
            menuChecklist.classList.remove('hidden');
        }
        if (menuApproval && ['Supervisor', 'Admin'].includes(session.role)) {
            menuApproval.classList.remove('hidden');
        }
    }
    
    // ... (Logika loginForm Anda tetap sama) ...
});

// --- FUNGSI NAVIGASI & SCANNER (Tetap sama seperti kode Anda) ---
function switchTab(target) { /* ... */ }
function openScanner() { /* ... */ }
function closeScanner() { /* ... */ }
function startScanner() { /* ... */ }
function stopScanner() { /* ... */ }
function showScanResult(text) { /* ... */ }
function resetScannerView() { /* ... */ }
async function hashPassword(str) { /* ... */ }
function logout() { /* ... */ }
