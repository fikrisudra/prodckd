const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';

// --- 1. Fungsi Keamanan (Hashing Password) ---
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- 2. Fungsi Logout ---
function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// --- 3. Fungsi Inject Navigasi Kapsul dengan Transisi Smooth ---
function injectNavbar() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';

    const navHTML = `
        <div class="bottom-nav">
            <a href="dashboard.html" class="nav-item ${page === 'dashboard.html' ? 'active' : ''}">
                <i class="fa-solid fa-house"></i><span>Home</span>
            </a>
            <a href="scan.html" class="nav-item ${page === 'scan.html' ? 'active' : ''}">
                <i class="fa-solid fa-qrcode"></i><span>Scan</span>
            </a>
            <a href="profile.html" class="nav-item ${page === 'profile.html' ? 'active' : ''}">
                <i class="fa-solid fa-user"></i><span>User</span>
            </a>
        </div>`;
    
    // Inject ke body
    document.body.insertAdjacentHTML('beforeend', navHTML);

    // Sedikit delay untuk memastikan transisi CSS slide-out teks berjalan saat navbar muncul
    setTimeout(() => {
        const activeItem = document.querySelector('.nav-item.active span');
        if (activeItem) {
            activeItem.style.opacity = "1";
            activeItem.style.maxWidth = "100px";
        }
    }, 50);
}

// --- 4. Logika Utama Saat Halaman Dimuat ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const session = JSON.parse(localStorage.getItem('userSession'));

    // Proteksi Halaman
    if (!session && page !== 'index.html') {
        window.location.href = 'index.html';
        return;
    }

    // Jika sudah login, tampilkan data & navbar
    if (session && page !== 'index.html') {
        injectNavbar();
        
        // Populate Data dengan pengecekan elemen
        const elements = {
            'userName': session.name,
            'userRole': session.role,
            'profileName': session.name,
            'profileID': 'ID: ' + (session.id || '-')
        };

        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = elements[id];
        });
    }

    // Logika Khusus Halaman Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (session) window.location.href = 'dashboard.html';

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const msg = document.getElementById('message');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
            msg.classList.add('hidden');

            const id = document.getElementById('userId').value;
            const pass = document.getElementById('password').value;
            const hashedPass = await hashPassword(pass);

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ id: id, password: hashedPass })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    result.id = id;
                    localStorage.setItem('userSession', JSON.stringify(result));
                    window.location.href = 'dashboard.html';
                } else {
                    msg.innerText = result.message || "Invalid Credentials";
                    msg.classList.remove('hidden');
                    btn.disabled = false;
                    btn.innerText = 'Sign In';
                }
            } catch (error) {
                console.error(error);
                alert("Server Connection Error");
                btn.disabled = false;
                btn.innerText = 'Sign In';
            }
        });
    }
});
