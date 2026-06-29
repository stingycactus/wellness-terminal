import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# Create your views here.
def index(request):
    return render(request, 'terminal/index.html')

@csrf_exempt
@require_POST

def command(request):
    data = json.loads(request.body)
    cmd = data.get('command')
    args = data.get('args', [])
    
    if cmd == 'focus':
        return handle_focus(request, args)
    
    elif cmd == 'reset': # for removing session storage, for debugging
        request.session.flush()
        return JsonResponse({'output': 'session cleared'})

    return JsonResponse({'output': f'command not found: {cmd}'})

def handle_focus(request, args):
    if len(args) == 0:
        areas = request.session.get('focus_areas', None)
        if not areas:
            return JsonResponse({'output': 'no focus areas set. usage: focus <area1> <area2> ...'})
        return JsonResponse({'output': f'current focus areas: {" · ".join(areas)}'})

    request.session['focus_areas'] = args
    return JsonResponse({'output': f'✓ focus areas saved: {" · ".join(args)}'})
    