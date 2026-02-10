const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';

// --- Utility: Hash Password ---
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Injector: Navigasi Bawah ---
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

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    if (session && page !== 'index.html') {
        injectNavbar();
        if (document.getElementById('userName')) document.getElementById('userName').innerText = session.name;
        if (document.getElementById('userRole')) document.getElementById('userRole').innerText = session.role;
        if (document.getElementById('profileName')) document.getElementById('profileName').innerText = session.name;
        if (document.getElementById('profileID')) document.getElementById('profileID').innerText = session.id;
    } else if (!session && page !== 'index.html') {
        window.location.href = 'index.html';
    }

    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const msg = document.getElementById('message');
            btn.disabled = true; btn.innerText = 'Mohon Tunggu...';
            
            const hashed = await hashPassword(document.getElementById('password').value);
            const id = document.getElementById('userId').value;

            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: hashed })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    result.id = id; // simpan id ke session
                    localStorage.setItem('userSession', JSON.stringify(result));
                    window.location.href = 'dashboard.html';
                } else {
                    msg.innerText = "ID atau Password Salah!";
                    msg.classList.remove('hidden');
                    btn.disabled = false; btn.innerText = 'Masuk Aplikasi';
                }
            } catch (err) {
                alert("Kesalahan Koneksi Server");
                btn.disabled = false;
            }
        });
    }
});
