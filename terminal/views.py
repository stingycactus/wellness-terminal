import json
import os
import google.generativeai as genai
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')

# Create your views here.
def index(request):
    return render(request, 'terminal/index.html')

@csrf_exempt
@require_POST

def command(request):
    data = json.loads(request.body)
    cmd = data.get('command')
    args = data.get('args', [])
    
    commands = {
        'focus': handle_focus,
        'get_quests': handle_get_quests,
        'refresh_quest': handle_refresh_quest,
        'complete_quest': complete_quest,
        'difficulty': handle_difficulty,
        'reset': handle_reset, # for removing session storage, for debugging
    }
    
    handler = commands.get(cmd)
    
    if handler:
        return handler(request, args)
    
    return JsonResponse({'output': f'command not found in views.py: {cmd}'}) # remove in views.py after done with project

def build_quest_prompt(focus_areas, difficulty):
    focus_str = ', '.join(focus_areas) if focus_areas else 'general_wellness'
    return f"""You are a wellness coach generating quests for a teenager.
        Focus areas: {focus_str}
        Difficulty: {difficulty}

        Difficulty guide:
        - easy: simple tasks, 5-15 minutes, no commitment needed
        - medium: require some effort or consistency
        - hard: challenging, requires real dedication

        Return ONLY a valid JSON array of exactly 7 short quest strings.
        No explanation, no markdown, no backticks. Example format:
        ["quest 1", "quest 2", "quest 3", "quest 4", "quest 5", "quest 6", "quest 7"]"""

def handle_get_quests(request, args):
    force_new = '--new' in args
    
    existing = request.session.get('quests', None)
    if existing and not force_new:
        return JsonResponse({'output': format_quests(existing)})

    focus_areas = request.session.get('focus_areas', [])
    difficulty = request.session.get('difficulty', 'medium')
    
    try:
        prompt = build_quest_prompt(focus_areas, difficulty)
        response = model.generate_content(prompt)
        quest_texts = json.loads(response.text)
        quests = {
            i+1: {'text': text, 'completed': False}
            for i, text in enumerate(quest_texts)
        }

        request.session['quests'] = quests
        formatted_quests = format_quests(quests)
        return JsonResponse({'output': formatted_quests})
    
    except Exception as e:
        return JsonResponse({'output': f'error generating quests: {str(e)}'})

def format_quests(quests):
    lines = ['your quests for this week:', '─' * 32]
    for id, q in quests.items():
        checkbox = '[✓]' if q['completed'] else '[ ]'
        lines.append(f"  [{id}] {checkbox} {q['text']}")
    lines.append('─' * 32)
    return '\n'.join(lines)

def complete_quest(request, args):
    existing_quests = request.session.get('quests', None)
    if not existing_quests:
        return JsonResponse({'output': "no quests to mark as complete, run get_quests first"})

    try:
        quest_to_complete = args[0] # no need to convert to 0 based since our quests dict stores from id 1 upwards
    except (ValueError, IndexError):
        return JsonResponse({'output': 'usage: complete_quest <number>'})
    
    if quest_to_complete not in existing_quests:
        print("QUESTS:", existing_quests)
        print("KEYS:", list(existing_quests.keys()))
        print("TYPE:", type(list(existing_quests.keys())[0]))
        print("LOOKING FOR:", quest_to_complete)
        return JsonResponse({'output': 'invalid quest id'})
    
    existing_quests[quest_to_complete]['completed'] = True
    
    request.session['quests'] = existing_quests
    request.session.modified = True
    
    return JsonResponse(
        {
            'output': (
                f"marked quest with id {quest_to_complete} as completed\n"
                f"{format_quests(existing_quests)}"
            )
        }
    )


def build_refresh_prompt(focus_areas, difficulty, quest_to_replace):
    focus_str = ', '.join(focus_areas) if focus_areas else 'general wellness'
    return f"""You are a wellness coach generating a single replacement quest for a teenager.
        Focus areas: {focus_str}
        Difficulty: {difficulty}
        Quest being replaced: {quest_to_replace}

        Difficulty guide:
        - easy: simple tasks, 5-15 minutes, no commitment needed
        - medium: require some effort or consistency
        - hard: challenging, requires real dedication

        Generate ONE different quest that is not similar to the one being replaced.
        Return ONLY a single plain string, no JSON, no explanation, no markdown, no quotes.
        Example: Go for a 10 minute walk before dinner"""

def handle_refresh_quest(request, args):
    quests = request.session.get('quests', None)
    if not quests:
        return JsonResponse({'output': 'no quests found. run get_quests first'})

    try:
        index = args[0]
    except (ValueError, IndexError):
        return JsonResponse({'output': 'usage: refresh_quest <number>'})

    if index not in quests:
        return JsonResponse({'output': 'invalid quest id'})

    focus_areas = request.session.get('focus_areas', [])
    difficulty = request.session.get('difficulty', 'medium')
    quest_to_replace = quests[index]['text']
    try:
        prompt = build_refresh_prompt(focus_areas, difficulty, quest_to_replace)
        response = model.generate_content(prompt)
        new_quest = response.text.strip()

        quests[index] = {
            'text': new_quest,
            'completed': False
        }

        request.session['quests'] = quests
        request.session.modified = True  # tell Django the session changed

        return JsonResponse (
            {
                "output": (
                    f"✓ quest {args[0]} refreshed:\n"
                    f"{format_quests(quests)}"
                )
            }
        )

    except Exception as e:
        return JsonResponse({'output': f'error refreshing quest: {str(e)}'})

def handle_focus(request, args):
    if len(args) == 0:
        areas = request.session.get('focus_areas', None)
        if not areas:
            return JsonResponse(
                {
                    "output": (
                        "no focus areas set \n"
                        "usage: focus <area1> <area2> ..."
                    )
                }
            )
        return JsonResponse({'output': f'current focus areas: {" · ".join(areas)}'})

    request.session['focus_areas'] = args
    return JsonResponse({'output': f'✓ focus areas saved: {" · ".join(args)}'})

def handle_difficulty(request, args):
    if len(args) == 0:
        difficulty = request.session.get('difficulty', 'medium')
        return JsonResponse(
            {
                "output": (
                    f"current difficulty: {difficulty}\n"
                    "usage: difficulty <easy/medium/hard/...>"
                )
            }
        )

    request.session['difficulty'] = args[0]
    return JsonResponse({"output": f"✓ difficulty saved: {args[0]}"})

def handle_reset(request, args):
    request.session.flush()
    return JsonResponse({'output': 'session cleared'})
