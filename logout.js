document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});