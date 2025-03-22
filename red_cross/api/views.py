from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import Item, User
from .serializers import ItemSerializer

class IsOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'

class IsRegularUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'user'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """
    Return information about the current user
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined,
        # Add any other relevant fields
    })

@api_view(['POST'])
def register_user(request):
    """Register a new user"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'username': 'This username is already taken'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists (if provided)
    if email and User.objects.filter(email=email).exists():
        return Response(
            {'email': 'This email is already registered'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the user
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        return Response(
            {'success': 'User registered successfully'}, 
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
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