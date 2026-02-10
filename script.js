const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// 1. Fungsi Hash SHA-256
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

// 2. Sistem Navigasi Tab (Beralih antar View)
function switchTab(target) {
    if (target === 'scan') return openScanner(); // Jika klik scan, buka popup

    const views = ['home', 'profile'];
    const navItems = document.querySelectorAll('.nav-item');

    // Sembunyikan semua halaman & reset icon
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    
    navItems.forEach(btn => btn.classList.remove('active'));

    // Tampilkan halaman target
    const targetView = document.getElementById('view-' + target);
    const targetBtn = document.getElementById('btn-' + target);
    
    if (targetView) targetView.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');
}

// 3. Logika Pop-up Scanner
function openScanner() {
    const modal = document.getElementById('scanner-modal');
    if (modal) {
        modal.classList.add('active');
        startScanner();
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
            // Haptic feedback & feedback visual
            if(navigator.vibrate) navigator.vibrate(100);
            
            // Logika setelah scan berhasil
            console.log("Scan Result:", text);
            document.getElementById('res-text').innerText = "Berhasil: " + text;
            
            // Tutup otomatis setelah 1 detik atau langsung
            setTimeout(() => {
                closeScanner();
                alert("Data Berhasil Dimuat: " + text);
            }, 500);
        }
    ).catch(err => console.warn("Kamera tidak diizinkan atau error:", err));
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Gagal menghentikan kamera"));
    }
}

// 4. Inisialisasi DOM
document.addEventListener('DOMContentLoaded', () => {
    // Load Sesi Pengguna
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        // Update UI Dashboard (Tema Orange)
        const nameEl = document.getElementById('userName');
        const profNameEl = document.getElementById('profileName');
        const profIdEl = document.getElementById('profileID');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.innerText = session.name;
        if (profNameEl) profNameEl.innerText = session.name;
        if (profIdEl) profIdEl.innerText = 'ID: ' + session.id;
        
        // Update avatar dengan warna Orange (#FF8C32)
        if (avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${session.name}&background=FF8C32&color=fff&bold=true`;
        }
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('loginBtn');
            const idInput = document.getElementById('userId');
            const passInput = document.getElementById('password');

            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> MEMVERIFIKASI...';

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
                    alert('Akses Ditolak: ID atau PIN Salah');
                    btn.disabled = false;
                    btn.innerText = 'MASUK SEKARANG';
                }
            } catch (err) {
                alert('Gangguan Server, Coba lagi nanti.');
                btn.disabled = false;
                btn.innerText = 'MASUK SEKARANG';
            }
        });
    }
});

// 5. Logout Sesi
function logout() {
    if(confirm("Apakah Anda ingin keluar dari sistem?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
