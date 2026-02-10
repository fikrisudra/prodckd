const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// Hash SHA-256
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Navigation Logic
function moveTab(index, el) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const buttons = document.querySelectorAll('.nav-btn');

    slider.style.transform = `translateX(-${index * 100}vw)`;
    
    buttons.forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    const offset = el.offsetLeft + (el.offsetWidth / 2) - 32;
    pill.style.transform = `translateX(${offset}px)`;

    index === 1 ? startScanner() : stopScanner();
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if(document.getElementById('profileName')) {
            document.getElementById('profileName').innerText = session.name;
            document.getElementById('profileID').innerText = 'ID: ' + session.id;
        }
    }

    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.innerText = 'Memverifikasi...';

            try {
                const id = document.getElementById('userId').value;
                const pass = await hashPassword(document.getElementById('password').value);

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id, password: pass })
                });
                const res = await response.json();

                if (res.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify({ name: res.name, id }));
                    window.location.href = 'main.html';
                } else {
                    alert('ID atau Password Salah');
                    btn.disabled = false;
                    btn.innerText = 'Masuk Sistem';
                }
            } catch (err) {
                alert('Gagal terhubung ke server');
                btn.disabled = false;
            }
        });
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        document.getElementById('res-text').innerText = text;
        if(navigator.vibrate) navigator.vibrate(50);
    }).catch(() => {});
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
