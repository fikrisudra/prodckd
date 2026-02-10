const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// 1. Fungsi Hash (Gunakan try-catch agar tidak memblokir UI jika gagal)
async function hashPassword(str) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.error("Hashing failed", e);
        return str; // Fallback jika browser sangat lama
    }
}

// 2. Navigasi Tab (Grab Style)
function switchTab(target) {
    const views = ['home', 'profile'];
    const btns = ['home', 'scan', 'profile'];

    // Sembunyikan semua view & reset tombol
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    btns.forEach(b => {
        const btn = document.getElementById('btn-' + b);
        if (btn) btn.classList.remove('active');
    });

    // Aktifkan target
    if (target === 'scan') {
        document.getElementById('scanner-view').classList.add('active');
        document.getElementById('btn-scan').classList.add('active');
        startScanner();
    } else {
        const scannerView = document.getElementById('scanner-view');
        if (scannerView) scannerView.classList.remove('active');
        
        const targetView = document.getElementById('view-' + target);
        if (targetView) targetView.classList.remove('hidden');
        
        const targetBtn = document.getElementById('btn-' + target);
        if (targetBtn) targetBtn.classList.add('active');
        
        stopScanner();
    }
}

// 3. Logika Inisialisasi (Penting agar input tidak lag/macet)
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan sesi jika ada
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        const nameEl = document.getElementById('userName');
        const profNameEl = document.getElementById('profileName');
        const profIdEl = document.getElementById('profileID');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.innerText = session.name;
        if (profNameEl) profNameEl.innerText = session.name;
        if (profIdEl) profIdEl.innerText = 'ID: ' + session.id;
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${session.name}&background=00B14F&color=fff&bold=true`;
    }

    // LOGIN LOGIC - Pastikan tidak ada yang menghalangi pengetikan
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Hanya dipanggil saat tombol diklik, bukan saat ngetik
            
            const btn = document.getElementById('loginBtn');
            const idInput = document.getElementById('userId');
            const passInput = document.getElementById('password');

            if (!idInput.value || !passInput.value) return;

            btn.disabled = true;
            btn.innerText = 'MEMVERIFIKASI...';

            try {
                const hashedPass = await hashPassword(passInput.value);
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: idInput.value, password: hashedPass })
                });
                const res = await response.json();

                if (res.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify({ name: res.name, id: idInput.value }));
                    window.location.href = 'main.html';
                } else {
                    alert('ID atau Password Salah');
                    btn.disabled = false;
                    btn.innerText = 'MASUK SEKARANG';
                }
            } catch (err) {
                console.error(err);
                alert('Gagal menghubungi server');
                btn.disabled = false;
                btn.innerText = 'MASUK SEKARANG';
            }
        });
    }
});

// 4. Scanner Engine
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 20, qrbox: 250 }, 
        (text) => {
            alert("Hasil Scan: " + text);
            switchTab('home');
        }
    ).catch(err => console.warn("Scanner error:", err));
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Stop failed", err));
    }
}

function logout() {
    if(confirm("Keluar dari aplikasi?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
