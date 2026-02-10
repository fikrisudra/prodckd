const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// Navigasi dengan kalkulasi posisi pill yang presisi
function moveTab(index, el = null) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.a16-nav-item');
    const target = el || items[index];

    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    if (pill) {
        const targetRect = target.getBoundingClientRect();
        const navRect = target.parentElement.getBoundingClientRect();
        const leftPos = targetRect.left - navRect.left;
        pill.style.transform = `translateX(${leftPos}px)`;
    }

    index === 1 ? startScanner() : stopScanner();
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    // Berikan jeda sedikit agar DOM siap sebelum pill bergerak
    setTimeout(() => moveTab(0), 150);

    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        if(document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if(document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if(document.getElementById('profileID')) document.getElementById('profileID').innerText = 'ID: ' + session.id;
        if(document.getElementById('barAvatar')) document.getElementById('barAvatar').src = `https://ui-avatars.com/api/?name=${session.name}&background=121212&color=fff&bold=true`;
    }
});

// Scanner Engine
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        document.getElementById('res-text').innerText = text;
        document.getElementById('scanned-result').classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate(50);
        stopScanner();
    }).catch(() => {});
}

function stopScanner() { if (html5QrCode?.isScanning) html5QrCode.stop(); }
function restartScanner() { document.getElementById('scanned-result').classList.add('hidden'); startScanner(); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
