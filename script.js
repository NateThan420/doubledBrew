document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const validUsername = 'admin';
        const validPassword = 'password123';

        if (username === validUsername && password === validPassword) {
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid username or password. Please try again.');
        }
    });
});
