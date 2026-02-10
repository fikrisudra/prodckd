const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode; 
let currentTabIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

function moveTab(index, el = null) {
    currentTabIndex = index;
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.nav-item');
    const targetEl = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;

    items.forEach(item => item.classList.remove('active'));
    targetEl.classList.add('active');

    // Jeda 50ms agar browser merender transisi teks sebelum lebar dihitung
    setTimeout(() => {
        if (pill && targetEl) {
            pill.style.width = `${targetEl.offsetWidth}px`;
            pill.style.left = `${targetEl.offsetLeft}px`;
        }
    }, 50);

    index === 1 ? startScanner() : stopScanner();
}

// SWIPE LOGIC
document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

function handleSwipe() {
    const threshold = 80;
    if (touchStartX - touchEndX > threshold) {
        if (currentTabIndex < 2) moveTab(currentTabIndex + 1);
    } else if (touchEndX - touchStartX > threshold) {
        if (currentTabIndex > 0) moveTab(currentTabIndex - 1);
    }
}

// SCANNER LOGIC
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    if (!html5QrCode.isScanning) {
        html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 200 }, (text) => {
            document.getElementById('res-text').innerText = text;
            document.getElementById('scanned-result').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(70);
            stopScanner();
        }).catch(() => {});
    }
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop();
}

function restartScanner() {
    document.getElementById('scanned-result').classList.add('hidden');
    startScanner();
}

// ON LOAD
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    if (session && page === 'main.html') {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('userRole').innerText = session.role;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'ID: ' + (session.id || '-');
        
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) setTimeout(() => moveTab(0, activeItem), 300);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (session) window.location.href = 'main.html';
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const msg = document.getElementById('message');
            btn.disabled = true;
            btn.innerHTML = 'Authenticating...';
            
            const id = document.getElementById('userId').value;
            const pass = document.getElementById('password').value;
            const hashedPass = await hashPassword(pass);

            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ id: id, password: hashedPass }) });
                const result = await response.json();
                if (result.status === 'success') {
                    result.id = id;
                    localStorage.setItem('userSession', JSON.stringify(result));
                    window.location.href = 'main.html';
                } else {
                    msg.innerText = result.message || "ID atau Password Salah";
                    msg.classList.remove('hidden');
                    btn.disabled = false;
                    btn.innerText = 'Sign In';
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }
});
