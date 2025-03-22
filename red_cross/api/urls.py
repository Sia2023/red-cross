from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, user_info, register_user

router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('user-info/', user_info, name='user-info'),
    path('register/', register_user, name='register'),
]