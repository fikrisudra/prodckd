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
    const items = document.querySelectorAll('.nav-btn');
    const target = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    if (pill) {
        const targetRect = target.getBoundingClientRect();
        const navRect = document.querySelector('.native-nav-bar').getBoundingClientRect();
        const centerX = targetRect.left - navRect.left + (targetRect.width / 2) - 32;
        pill.style.transform = `translateX(${centerX}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial UI positioning
    setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.innerHTML = 'Verifying Credential...';

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
                    alert('Identity Mismatch: Access Denied');
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm Identity <i class="ri-arrow-right-line"></i>';
                }
            } catch (err) {
                alert('Connection Loss: Server Unreachable');
                btn.disabled = false;
            }
        });
    }

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && document.getElementById('userName')) {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'Employee ID: ' + session.id;
        document.getElementById('barAvatar').src = `https://ui-avatars.com/api/?name=${session.name}&background=222&color=fff`;
    }
});

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: { width: 250, height: 250 } }, (text) => {
        document.getElementById('res-text').innerText = 'SCANNED: ' + text;
        document.getElementById('scanned-result').classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate(50);
        stopScanner();
    }).catch(() => {});
}

function restartScanner() {
    document.getElementById('scanned-result').classList.add('hidden');
    startScanner();
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
