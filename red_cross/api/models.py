from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [('owner', 'Owner'), ('user', 'User')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    # Customize groups with a unique related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_user_set',  # Unique reverse accessor
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )

    # Customize user_permissions with a unique related_name
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_user_set',  # Unique reverse accessor
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

# Add the Item model here
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
    image = models.ImageField(upload_to='items/', null=True, blank=True)

    def __str__(self):
        return self.name