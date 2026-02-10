const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode, currentTabIndex = 0;

async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const dot = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    const target = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    if (dot) {
        const targetRect = target.getBoundingClientRect();
        const navRect = document.querySelector('.nav-hybrid').getBoundingClientRect();
        const centerX = targetRect.left - navRect.left + (targetRect.width / 2) - 3;
        dot.style.transform = `translateX(${centerX}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial dot positioning
    setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const id = document.getElementById('userId').value.trim();
            const pass = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerHTML = 'SYNCING_DATA...';

            try {
                const hp = await hashPassword(pass);
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ id, password: hp }) });
                const res = await response.json();
                
                if (res.status === 'success') {
                    res.id = id;
                    localStorage.setItem('userSession', JSON.stringify(res));
                    window.location.href = 'main.html';
                } else {
                    alert('ACCESS_DENIED: ' + (res.message || 'Invalid Credentials'));
                    btn.disabled = false;
                    btn.innerHTML = 'AUTHENTICATE <i class="ri-shield-keyhole-line"></i>';
                }
            } catch (err) {
                alert('NETWORK_FAILURE');
                btn.disabled = false;
            }
        });
    }

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && document.getElementById('userName')) {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'ID: ' + session.id;
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (!html5QrCode.isScanning) {
        html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
            document.getElementById('res-text').innerText = 'SCANNED_DATA: ' + text;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(40);
            stopScanner();
        }).catch(() => {});
    }
}
function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
