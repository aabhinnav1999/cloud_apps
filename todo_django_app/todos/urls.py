from django.urls import path
from . import views

app_name = "todos"

urlpatterns = [
    path("", views.index, name="index"),
    path("add/", views.add_todo, name="add"),
    path("toggle/<int:todo_id>/", views.toggle_todo, name="toggle"),
    path("delete/<int:todo_id>/", views.delete_todo, name="delete"),
    path("clear-completed/", views.clear_completed, name="clear_completed"),
]
