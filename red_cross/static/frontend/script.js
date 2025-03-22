const BASE_URL = '/api/';

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const response = await fetch(`${BASE_URL}token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.access);
        window.location.href = '/';
    } else {
        alert('Login failed');
    }
});

// Load items
async function loadItems() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}items/`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const items = await response.json();
    const itemList = document.getElementById('item-list');
    itemList.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `<p>${item.name} - $${item.price} (${item.status})</p>
            ${item.status === 'available' ? `<button onclick="bookItem(${item.id})">Book</button>` : ''}`;
        itemList.appendChild(div);
    });
}

// Book item
async function bookItem(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}items/${id}/book/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) loadItems();
    else alert('Booking failed');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login/';
}

// Load items on index page
if (!window.location.pathname.includes('login')) loadItems();