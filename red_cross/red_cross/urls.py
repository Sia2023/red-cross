"""
URL configuration for red_cross project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.generic import TemplateView
from django.conf.urls.static import static 
from django.conf import settings
from api.serializers import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Frontend routes
    path('', TemplateView.as_view(template_name='frontend/home.html'), name='home'),
    path('items/', TemplateView.as_view(template_name='frontend/index.html'), name='items'),
    path('login/', TemplateView.as_view(template_name='frontend/login.html'), name='login'),
    path('signup/', TemplateView.as_view(template_name='frontend/signup.html'), name='signup'),
    path('dashboard/', TemplateView.as_view(template_name='frontend/dashboard.html'), name='dashboard'),
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Add media URL patterns to serve uploaded images in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
