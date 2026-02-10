const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// 1. Keamanan Hashing SHA-256
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. Navigasi Tab
function moveTab(index, el = null) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.a16-nav-item');
    const target = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    if (pill) {
        const offset = target.offsetLeft - 25; // Sesuai padding navigasi
        pill.style.transform = `translateX(${offset}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
    if(navigator.vibrate) navigator.vibrate(10);
}

// 3. Logic Login & Session
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('mainSlider')) setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.innerHTML = 'Memverifikasi...';

            try {
                const id = document.getElementById('userId').value.trim();
                const hp = await hashPassword(document.getElementById('password').value);

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: hp })
                });
                const res = await response.json();

                if (res.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify({ name: res.name, id: id }));
                    window.location.href = 'main.html';
                } else {
                    alert('Akses Ditolak: ID atau Password Salah');
                    btn.disabled = false;
                    btn.innerHTML = 'Masuk Sistem <i class="ri-arrow-right-up-line"></i>';
                }
            } catch (err) {
                alert('Gangguan Koneksi');
                btn.disabled = false;
                btn.innerHTML = 'Masuk Sistem';
            }
        });
    }

    // Load Data User
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        const userEl = document.getElementById('userName');
        if(userEl) {
            userEl.innerText = session.name;
            document.getElementById('profileName').innerText = session.name;
            document.getElementById('profileID').innerText = 'MYPROD ID: ' + session.id;
            document.getElementById('barAvatar').src = `https://ui-avatars.com/api/?name=${session.name}&background=121212&color=fff&bold=true`;
        }
    }
});

// 4. Vision Engine
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        document.getElementById('res-text').innerText = 'Data: ' + text;
        document.getElementById('scanned-result').classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate(50);
        stopScanner();
    }).catch(() => {});
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function restartScanner() { document.getElementById('scanned-result').classList.add('hidden'); startScanner(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
