const BASE_URL = '/api/';

// Parse JWT token to get user info
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Check user role
function getUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decodedToken = parseJwt(token);
    return decodedToken && decodedToken.role ? decodedToken.role : null;
}

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        console.log('Attempting login with:', username);
        const response = await fetch(`${BASE_URL}token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        console.log('Login response:', response.status, data);
        
        if (response.ok) {
            localStorage.setItem('token', data.access);
            window.location.href = '/items';
        } else {
            alert('Login failed: ' + (data.detail || 'Invalid credentials'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    }
});

// Register
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email')?.value || '';
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Add password confirmation check
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        console.log('Attempting registration with:', username);
        
        // Ensure we have the correct URL
        const registerUrl = `${BASE_URL}register/`;
        console.log('Registration URL:', registerUrl);
        
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        
        // Check if response is JSON or something else
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Registration response:', response.status, data);
            
            if (response.ok) {
                alert('Registration successful! Please log in.');
                window.location.href = '/login';
            } else {
                alert('Registration failed: ' + (data.error || JSON.stringify(data)));
            }
        } else {
            // Not JSON, likely HTML error page
            const text = await response.text();
            console.error('Non-JSON response:', response.status, text.substring(0, 200) + '...');
            alert('Registration error: Server returned an invalid response. Please check the console for details.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration error: ' + error.message);
    }
});

// Load items
async function loadItems() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Only redirect to login if on a protected page
        if (window.location.pathname.includes('items') || 
            window.location.pathname.includes('dashboard')) {
            window.location.href = '/login/';
            return;
        }
        return; // Don't proceed with loading items if no token on public pages
    }
    
    try {
        const response = await fetch(`${BASE_URL}items/`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired
                localStorage.removeItem('token');
                // Only redirect to login if on a protected page
                if (window.location.pathname.includes('items') || 
                    window.location.pathname.includes('dashboard')) {
                    window.location.href = '/login/';
                    return;
                }
                return;
            }
            throw new Error('Failed to load items');
        }
        
        const items = await response.json();
        const itemList = document.getElementById('item-list');
        if (!itemList) return; // Exit if not on a page with item list
        
        itemList.innerHTML = '';
        
        // Get the decoded token
        const decoded = parseJwt(token);
        
        // Check if admin section should be displayed
        showAdminSection(decoded);
        
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            // Item status class
            const statusClass = `status-${item.status.toLowerCase()}`;
            
            // Build HTML for the item card
            let imgHtml = '';
            if (item.image) {
                imgHtml = `<img src="${item.image}" alt="${item.name}" class="item-image">`;
            } else {
                imgHtml = `<div class="item-image" style="background-color: #eee; display: flex; align-items: center; justify-content: center;">No Image</div>`;
            }
            
            let actionButton = '';
            if (item.status === 'available') {
                actionButton = `<button onclick="bookItem(${item.id})" class="btn">Book</button>`;
            } else if (item.status === 'booked' && getUserRole() === 'user') {
                // Check if booked by current user
                const token = localStorage.getItem('token');
                const decoded = parseJwt(token);
                if (decoded && item.booked_by === decoded.user_id) {
                    actionButton = `<button onclick="cancelBooking(${item.id})" class="btn">Cancel Booking</button>`;
                }
            }
            
            // Add admin actions
            let adminActions = '';
            if (getUserRole() === 'owner') {
                adminActions = `
                    <div class="admin-actions">
                        ${item.status !== 'sold' ? 
                          `<button onclick="markAsSold(${item.id})" class="btn admin-btn">Mark as Sold</button>` : ''}
                        <button onclick="deleteItem(${item.id})" class="btn admin-btn delete-btn">Delete</button>
                    </div>
                `;
            }
            
            itemCard.innerHTML = `
                ${imgHtml}
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-price">$${item.price}</p>
                    <p class="item-description">${item.description}</p>
                    <span class="item-status ${statusClass}">${item.status}</span>
                    <div class="item-actions">
                        ${actionButton}
                    </div>
                    ${adminActions}
                </div>
            `;
            
            itemList.appendChild(itemCard);
        });
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Show admin section based on user role
async function showAdminSection(decoded) {
    const adminSection = document.getElementById('admin-section');
    if (!adminSection) return;
    
    // Show admin section for user_id 1 (admin) or role owner
    if (decoded && decoded.user_id === 1) {
        adminSection.style.display = 'block';
    } else if (decoded && decoded.role === 'owner') {
        adminSection.style.display = 'block';
    } else {
        // Try to fetch user info from API as a fallback
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}user-info/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.is_superuser || userData.role === 'owner') {
                    adminSection.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }
}

// Book item
async function bookItem(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BASE_URL}items/${id}/book/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
            loadItems();
        } else {
            const data = await response.json();
            alert('Booking failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error booking item:', error);
    }
}

// Cancel booking
async function cancelBooking(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BASE_URL}items/${id}/cancel_booking/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
            loadItems();
        } else {
            const data = await response.json();
            alert('Cancellation failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error canceling booking:', error);
    }
}

// Add item (for admin/owner only)
document.getElementById('add-item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    
    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const response = await fetch(`${BASE_URL}items/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type here, let the browser set it with the boundary
            },
            body: formData
        });
        
        if (response.ok) {
            // Reset form and reload items
            document.getElementById('add-item-form').reset();
            loadItems();
        } else {
            const data = await response.json();
            const errorMessage = Object.entries(data)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            alert('Failed to add item:\n' + errorMessage);
            console.error('Error response:', data);
        }
    } catch (error) {
        console.error('Error adding item:', error);
    }
});

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Initialize page based on current location
document.addEventListener('DOMContentLoaded', function() {
    // Update navigation based on authentication
    updateNavigation();
    
    // Load items if on the items page
    if (window.location.pathname.includes('items')) {
        loadItems();
    }
    
    // Load user bookings if on the dashboard/profile page
    if (window.location.pathname.includes('dashboard')) {
        loadUserBookings();
    }
});

// Function to update navigation links based on authentication status
function updateNavigation() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const logoutLink = document.getElementById('logout-link');
    const dashboardLink = document.getElementById('dashboard-link');
    
    if (token) {
        // User is logged in
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline';
        if (dashboardLink) dashboardLink.style.display = 'inline';
        
        // Check if user is admin
        try {
            const decoded = parseJwt(token);
            if (decoded && (decoded.user_id === 1 || decoded.is_admin)) {
                if (dashboardLink) dashboardLink.style.display = 'inline';
            }
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    } else {
        // User is not logged in
        if (loginLink) loginLink.style.display = 'inline';
        if (signupLink) signupLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

// Expose functions to window object for HTML onclick handlers
window.bookItem = bookItem;
window.cancelBooking = cancelBooking;
window.logout = logout;
window.markAsSold = markAsSold;
window.deleteItem = deleteItem;

// Mark item as sold (admin only)
async function markAsSold(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${BASE_URL}items/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'sold'
            })
        });
        
        if (response.ok) {
            loadItems();
        } else {
            const data = await response.json();
            alert('Failed to mark as sold: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error marking item as sold:', error);
    }
}

// Delete item (admin only)
async function deleteItem(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}items/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadItems();
        } else {
            const data = await response.json();
            alert('Failed to delete item: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

// Load user's booked items for dashboard/profile page
async function loadUserBookings() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login/';
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}items/`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login/';
                return;
            }
            throw new Error('Failed to load items');
        }
        
        const items = await response.json();
        const bookingsContainer = document.getElementById('user-bookings');
        if (!bookingsContainer) return; // Exit if container not found
        
        // Get the current user's ID from the token
        const decoded = parseJwt(token);
        if (!decoded) return;
        
        // Filter items booked by current user
        const userBookings = items.filter(item => 
            item.status === 'booked' && item.booked_by === decoded.user_id
        );
        
        if (userBookings.length === 0) {
            bookingsContainer.innerHTML = '<div class="no-bookings">No bookings found. Browse items to make a booking.</div>';
            return;
        }
        
        bookingsContainer.innerHTML = '';
        
        userBookings.forEach(item => {
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';
            
            // Build HTML for the booking
            let imgHtml = '';
            if (item.image) {
                imgHtml = `<img src="${item.image}" alt="${item.name}" class="booking-image">`;
            } else {
                imgHtml = `<div class="booking-image" style="background-color: #eee; display: flex; align-items: center; justify-content: center;">No Image</div>`;
            }
            
            bookingItem.innerHTML = `
                ${imgHtml}
                <div class="booking-details">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <p class="item-price">$${item.price}</p>
                    <div class="booking-actions">
                        <button onclick="cancelBooking(${item.id})" class="cancel-btn">Cancel Booking</button>
                    </div>
                </div>
            `;
            
            bookingsContainer.appendChild(bookingItem);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}