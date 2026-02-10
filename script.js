/**
 * MYPROD Ecosystem v16.0
 * Native Script Engine - Android 16 Expressive UI
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';
let html5QrCode;

// 1. SECURITY: SHA-256 Hashing Engine
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. NAVIGATION: Android 16 Spring Motion
function moveTab(index, el = null) {
    const slider = document.getElementById('mainSlider');
    const pill = document.getElementById('navPill');
    const items = document.querySelectorAll('.a16-nav-item');
    const target = el || items[index];

    // Slide viewport
    if (slider) slider.style.transform = `translateX(-${index * 100}vw)`;
    
    // Update Active State
    items.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    // Move Indicator Pill with Spring Physics
    if (pill) {
        const offset = target.offsetLeft - 30; // 30 is container padding
        pill.style.transform = `translateX(${offset}px)`;
    }

    // Contextual Actions
    index === 1 ? startScanner() : stopScanner();
    
    // Haptic Feedback (Vibrate)
    if(navigator.vibrate) navigator.vibrate(8); 
}

// 3. AUTHENTICATION: Secure Login Flow
document.addEventListener('DOMContentLoaded', () => {
    // Sync UI position on start
    setTimeout(() => moveTab(0), 100);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const idInput = document.getElementById('userId');
            const passInput = document.getElementById('password');

            // UI State: Loading
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line spin-anim"></i> Authenticating...';

            try {
                const id = idInput.value.trim();
                const hashedPassword = await hashPassword(passInput.value);

                // Fetch to Apps Script
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        id: id, 
                        password: hashedPassword 
                    })
                });

                const res = await response.json();

                if (res.status === 'success') {
                    // Success Haptic
                    if(navigator.vibrate) navigator.vibrate([30, 50]);
                    
                    // Save Session
                    localStorage.setItem('userSession', JSON.stringify({
                        name: res.name || 'Operator',
                        id: id
                    }));
                    
                    window.location.href = 'main.html';
                } else {
                    throw new Error('Invalid Credentials');
                }

            } catch (err) {
                // UI State: Error/Invalid
                alert('Access Denied: Check ID and Password.');
                btn.disabled = false;
                btn.innerHTML = 'Sign In <i class="ri-arrow-right-up-line"></i>';
                passInput.value = ''; // Security clear
                if(navigator.vibrate) navigator.vibrate(100); 
            }
        });
    }

    // 4. DATA BINDING: Dashboard Sync
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && document.getElementById('userName')) {
        document.getElementById('userName').innerText = session.name;
        document.getElementById('profileName').innerText = session.name;
        document.getElementById('profileID').innerText = 'MYPROD ID: ' + session.id;
        
        // Dynamic Profile Image
        const avatar = document.getElementById('barAvatar');
        if(avatar) avatar.src = `https://ui-avatars.com/api/?name=${session.name}&background=121212&color=fff&bold=true`;
    }
});

// 5. VISION: QR/Object Scanner Engine
function startScanner() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 24, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, (text) => {
        // Success Scan
        document.getElementById('res-text').innerText = 'DATA: ' + text;
        document.getElementById('scanned-result').classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate(40);
        stopScanner();
    }).catch(err => {
        console.warn("Scanner initialization failed.");
    });
}

function stopScanner() { 
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log("Stop failed", err));
    } 
}

function restartScanner() {
    document.getElementById('scanned-result').classList.add('hidden');
    startScanner();
}

// 6. SESSION: Logout Handler
function logout() { 
    if(confirm("Are you sure you want to sign out?")) {
        localStorage.clear(); 
        window.location.href = 'index.html'; 
    }
}
