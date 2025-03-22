Step 1: Verify Django Project Setup
Let’s ensure your project is correctly configured with SQLite and ready to go.
Check settings.py
Open your project’s settings.py file (e.g., secondhand_platform/settings.py) and verify the DATABASES configuration is set to use SQLite. It should look like this:
python

import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

If this is already set (it’s the default for a new Django project), you’re good to go. If not, update it and save the file.

Apply Migrations
Run the following command to apply Django’s default migrations and create the db.sqlite3 file in your project’s root directory:
bash

python manage.py migrate

After running this, check your project folder for a new db.sqlite3 file.

Create a Superuser
Create an admin account to test the system:
bash

python manage.py createsuperuser

Follow the prompts to enter a username, email, and password. This will be your site owner account for now.

Test the Server
Since you’ve already run python manage.py runserver, visit http://127.0.0.1:8000/admin/ in your browser. Log in with your superuser credentials to confirm everything works.

Step 2: Define Models
Now, let’s define the User and Item models for your platform. Assuming you have an app called api (if not, run python manage.py startapp api to create it).
Update api/models.py
Open api/models.py and add the following:
python

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [('owner', 'Owner'), ('user', 'User')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

class Item(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('sold', 'Sold'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')
    booked_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.name

Register the App
In settings.py, ensure 'api' is in INSTALLED_APPS:
python

INSTALLED_APPS = [
    ...
    'api',
]

Run Migrations for Models
Create and apply migrations for your new models:
bash

python manage.py makemigrations
python manage.py migrate

This will update your SQLite database with tables for User and Item.

Step 3: Set Up Authentication
Let’s use Django REST Framework (DRF) with Simple JWT for token-based authentication.
Install Dependencies
Install DRF and Simple JWT:
bash

pip install djangorestframework djangorestframework-simplejwt

Update settings.py
Add these apps and configure DRF:
python

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework_simplejwt',
    'api',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

Set Up Token URLs
Edit your project’s urls.py (e.g., secondhand_platform/urls.py) to include token endpoints:
python

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

Step 4: Create API Endpoints
Now, let’s set up the API for managing items.
Create Serializers
In api/serializers.py, add:
python

from rest_framework import serializers
from .models import Item

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'price', 'status', 'booked_by']

Create Views
In api/views.py, define the ItemViewSet:
python

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Item
from .serializers import ItemSerializer

class IsOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'

class IsRegularUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'user'

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwner()]
        elif self.action in ['book', 'cancel_booking']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[IsRegularUser])
    def book(self, request, pk=None):
        item = self.get_object()
        if item.status != 'available':
            return Response({'error': 'Item is not available'}, status=400)
        item.status = 'booked'
        item.booked_by = request.user
        item.save()
        return Response({'message': 'Item booked successfully'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel_booking(self, request, pk=None):
        item = self.get_object()
        if item.booked_by != request.user:
            return Response({'error': 'You did not book this item'}, status=403)
        item.status = 'available'
        item.booked_by = None
        item.save()
        return Response({'message': 'Booking canceled'})

Set Up URLs
Create api/urls.py (if it doesn’t exist) and add:
python

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

Step 5: Test the Backend
Your server is already running, so let’s test the API.
Test Authentication
Use a tool like curl or Postman to get a token:
bash

curl -X POST http://127.0.0.1:8000/api/token/ -d "username=yourusername&password=yourpassword"

You’ll get a response with an access token. Save it for the next step.

Test Item Endpoints
List items using the token:
bash

curl -H "Authorization: Bearer your_access_token" http://127.0.0.1:8000/api/items/

If this works, your backend is set up correctly. You can add items via the Django admin panel (http://127.0.0.1:8000/admin/) as the superuser.

Step 6: Build a Simple Frontend
Let’s create a basic frontend to interact with your API.
Create Folder Structure
In your project root, create a frontend folder:

frontend/
  ├── index.html
  ├── login.html
  ├── script.js
  └── style.css

Login Page (login.html)  
html

<!DOCTYPE html>
<html>
<head><title>Login</title><link rel="stylesheet" href="style.css"></head>
<body>
    <h1>Login</h1>
    <form id="login-form">
        <input type="text" id="username" placeholder="Username" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
    <script src="script.js"></script>
</body>
</html>

Main Page (index.html)  
html

<!DOCTYPE html>
<html>
<head><title>Second-Hand Items</title><link rel="stylesheet" href="style.css"></head>
<body>
    <h1>Available Items</h1>
    <div id="item-list"></div>
    <button onclick="logout()">Logout</button>
    <script src="script.js"></script>
</body>
</html>

JavaScript (script.js)  
javascript

const BASE_URL = 'http://127.0.0.1:8000/api/';

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
        window.location.href = 'index.html';
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
    window.location.href = 'login.html';
}

// Load items on index page
if (window.location.pathname.includes('index.html')) loadItems();

Basic CSS (style.css)  
css

body { font-family: Arial, sans-serif; margin: 20px; }
input, button { margin: 5px; padding: 5px; }

Serve the Frontend
Open a new terminal, navigate to the frontend folder, and run:
bash

cd frontend
python -m http.server 8001

Visit http://localhost:8001/login.html in your browser.

Step 7: Test the Full System
Login: Go to http://localhost:8001/login.html and log in with your superuser credentials.

View Items: You’ll be redirected to index.html, where you can see items (add some via the admin panel first).

Book Items: As a regular user (create one via admin), you can book available items.

