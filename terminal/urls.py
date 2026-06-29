from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/command/', views.command, name='command'), # JSON API, receives commands from JS, returns JSON responses
]