// CONFIGURATION - Ganti dengan URL Deployment Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGNRPPBJfuG6SwjRK7onLVJR7-JADtm-jLbWx7B_d3n0g1hd9p5_ZuBNNhxhW3zZ4i/exec';

// --- FUNGSI GLOBAL (Utility) ---

/**
 * Mengubah teks biasa menjadi hash SHA-256 (Hexadecimal)
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Menghapus sesi dan kembali ke login
 */
function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// --- LOGIKA UTAMA ---

document.addEventListener('DOMContentLoaded', () => {
    // Mendeteksi halaman saat ini
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const session = JSON.parse(localStorage.getItem('userSession'));

    // 1. LOGIKA HALAMAN LOGIN (index.html atau root "/")
    if (page === 'index.html' || page === '' || page === 'index') {
        
        // Jika sudah login, langsung lempar ke dashboard
        if (session) {
            window.location.href = 'dashboard.html';
            return;
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const loginBtn = document.getElementById('loginBtn');
                const message = document.getElementById('message');
                const idInput = document.getElementById('userId').value;
                const passInput = document.getElementById('password').value;

                // UI Loading State
                loginBtn.disabled = true;
                loginBtn.innerText = 'Memproses...';
                message.classList.add('hidden');

                try {
                    // Hash password sebelum dikirim
                    const hashedPassword = await hashPassword(passInput);

                    // Kirim data ke Google Apps Script
                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        mode: 'cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ 
                            id: idInput, 
                            password: hashedPassword 
                        })
                    });

                    const result = await response.json();

                    if (result.status === 'success') {
                        // Simpan hasil (nama & role) ke storage
                        localStorage.setItem('userSession', JSON.stringify(result));
                        window.location.href = 'dashboard.html';
                    } else {
                        // Tampilkan pesan error dari server
                        message.innerText = result.message || "ID atau Password salah!";
                        message.classList.remove('hidden');
                        loginBtn.disabled = false;
                        loginBtn.innerText = 'Login';
                    }
                } catch (error) {
                    console.error("Login Error:", error);
                    message.innerText = "Gagal terhubung ke server. Cek koneksi atau URL Script.";
                    message.classList.remove('hidden');
                    loginBtn.disabled = false;
                    loginBtn.innerText = 'Login';
                }
            });
        }
    }

    // 2. LOGIKA HALAMAN DASHBOARD (dashboard.html)
    if (page === 'dashboard.html' || page === 'dashboard') {
        
        // Jika tidak ada sesi, tendang kembali ke login
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Isi data ke elemen HTML
        const nameElement = document.getElementById('userName');
        const roleElement = document.getElementById('userRole');

        if (nameElement) nameElement.innerText = session.name;
        if (roleElement) roleElement.innerText = session.role;
    }
});
