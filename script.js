const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function moveTab(index, el = null) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-trigger');
    const target = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    if (pill) {
        const offset = target.offsetLeft - 8;
        pill.style.transform = `translateX(${offset}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.innerText = 'Verifying...';

            try {
                const id = document.getElementById('userId').value.trim();
                const hp = await hashPassword(document.getElementById('password').value);
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id, password: hp })
                });
                const res = await response.json();
                
                if (res.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify({...res, id}));
                    window.location.href = 'main.html';
                } else {
                    alert('Invalid ID or Password');
                    btn.disabled = false;
                    btn.innerText = 'Sign In';
                }
            } catch (err) {
                alert('Connection Error');
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && document.getElementById('userName')) {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'Employee ID: ' + session.id;
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        document.getElementById('res-text').innerText = text;
        document.getElementById('scanned-result').classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate(60);
        stopScanner();
    }).catch(() => {});
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
