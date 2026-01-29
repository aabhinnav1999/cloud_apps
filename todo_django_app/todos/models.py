from django.db import models


class Todo(models.Model):
    text = models.CharField(max_length=140)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]  # newest first

    def __str__(self) -> str:
        return self.text
