const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// Pindah Tab gaya Mobile App
function switchTab(target) {
    const views = ['home', 'profile'];
    const btns = ['home', 'scan', 'profile'];

    // Reset UI
    views.forEach(v => document.getElementById('view-' + v)?.classList.add('hidden'));
    btns.forEach(b => document.getElementById('btn-' + b)?.classList.remove('active'));

    if (target === 'scan') {
        document.getElementById('scanner-view').classList.add('active');
        document.getElementById('btn-scan').classList.add('active');
        startScanner();
    } else {
        document.getElementById('scanner-view').classList.remove('active');
        document.getElementById('view-' + target).classList.remove('hidden');
        document.getElementById('btn-' + target).classList.add('active');
        stopScanner();
    }
}

function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => {
        alert("Terdeteksi: " + text);
        switchTab('home');
    }).catch(err => console.error(err));
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop();
    }
}

// Load Session
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session) {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'ID: ' + session.id;
        document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${session.name}&background=00B14F&color=fff&bold=true`;
    }
});

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
