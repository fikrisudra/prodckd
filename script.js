const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// Hash SHA-256
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Navigation for Web (Page Switching)
function showPage(pageId, el) {
    // Update Nav UI
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    el.classList.add('active');

    // Update Pages
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('page-' + pageId).classList.remove('hidden');

    // Update Title
    const titles = { dash: 'Dashboard Overview', scan: 'System Vision Scanner', user: 'Account Information' };
    document.getElementById('page-title').innerText = titles[pageId];

    // Scanner logic
    pageId === 'scan' ? startScanner() : stopScanner();
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if(document.getElementById('topUserName')) document.getElementById('topUserName').innerText = session.name;
        if(document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if(document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
    }

    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.innerText = 'VERIFYING...';
            btn.disabled = true;

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
                    alert('Invalid ID or Password');
                    btn.disabled = false;
                    btn.innerText = 'SIGN IN';
                }
            } catch (err) {
                alert('Connection error');
                btn.disabled = false;
                btn.innerText = 'SIGN IN';
            }
        });
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        document.getElementById('res-text').innerText = "RESULT: " + text;
    }).catch(() => {});
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
