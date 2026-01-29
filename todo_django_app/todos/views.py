from django.shortcuts import redirect, render, get_object_or_404
from django.views.decorators.http import require_POST
from .models import Todo


def index(request):
    f = request.GET.get("filter", "all")

    qs = Todo.objects.all()
    if f == "active":
        qs = qs.filter(completed=False)
    elif f == "completed":
        qs = qs.filter(completed=True)

    active_count = Todo.objects.filter(completed=False).count()
    completed_count = Todo.objects.filter(completed=True).count()

    return render(
        request,
        "todos/index.html",
        {
            "todos": qs,
            "filter": f,
            "active_count": active_count,
            "completed_count": completed_count,
        },
    )


@require_POST
def add_todo(request):
    text = (request.POST.get("text") or "").strip()
    if text:
        Todo.objects.create(text=text)
    return redirect_with_filter(request)


@require_POST
def toggle_todo(request, todo_id: int):
    todo = get_object_or_404(Todo, id=todo_id)
    todo.completed = not todo.completed
    todo.save(update_fields=["completed"])
    return redirect_with_filter(request)


@require_POST
def delete_todo(request, todo_id: int):
    todo = get_object_or_404(Todo, id=todo_id)
    todo.delete()
    return redirect_with_filter(request)


@require_POST
def clear_completed(request):
    Todo.objects.filter(completed=True).delete()
    return redirect_with_filter(request)


def redirect_with_filter(request):
    # keep current filter after POST actions
    f = request.GET.get("filter", "all")
    if f in ("all", "active", "completed"):
        return redirect(f"/?filter={f}")
    return redirect("/")
