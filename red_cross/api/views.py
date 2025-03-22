from django.shortcuts import render

# Create your views here.
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