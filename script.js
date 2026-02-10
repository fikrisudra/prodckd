const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';

// 1. Fungsi Hash SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. Fungsi Inject Navbar Capsule
function injectNavbar() {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    const navHTML = `
        <div class="bottom-nav">
            <a href="dashboard.html" class="nav-item ${page === 'dashboard.html' ? 'active' : ''}">
                <i class="fa-solid fa-house"></i><span>Home</span>
            </a>
            <a href="scan.html" class="nav-item ${page === 'scan.html' ? 'active' : ''}">
                <i class="fa-solid fa-qrcode"></i><span>Scan</span>
            </a>
            <a href="profile.html" class="nav-item ${page === 'profile.html' ? 'active' : ''}">
                <i class="fa-solid fa-user"></i><span>Profile</span>
            </a>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', navHTML);
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// 3. Event Listener Utama
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    // Proteksi Halaman
    if (!session && page !== 'index.html') {
        window.location.href = 'index.html';
        return;
    }

    if (session && page !== 'index.html') injectNavbar();

    // Logika Login
    if (page === 'index.html') {
        if (session) window.location.href = 'dashboard.html';
        const form = document.getElementById('loginForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.disabled = true; btn.innerText = 'Checking...';
            
            const passHash = await hashPassword(document.getElementById('password').value);
            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: document.getElementById('userId').value, password: passHash })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    localStorage.setItem('userSession', JSON.stringify(data));
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Login Gagal!');
                    btn.disabled = false; btn.innerText = 'Login';
                }
            } catch (e) { alert('Error Koneksi'); btn.disabled = false; }
        });
    }

    // Logika Dashboard & Profile
    if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
    if (document.getElementById('userRole')) document.getElementById('userRole').innerText = session.role;
    if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
    if (document.getElementById('profileID')) document.getElementById('profileID').innerText = session.id || 'N/A';
});
