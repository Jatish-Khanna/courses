from flask import Flask, send_from_directory, request, jsonify
import json
import os
from datetime import datetime
import random
import string

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_folder=BASE_DIR,       # serve files from this folder
    static_url_path=''            # so /index.html, /data.js, /results.json work
)

RESULTS_FILE = os.path.join(BASE_DIR, 'results.json')


def load_results():
    if not os.path.exists(RESULTS_FILE):
        return []
    try:
        with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
            data = f.read().strip()
            if not data:
                return []
            return json.loads(data)
    except Exception:
        return []


def save_results(results):
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


@app.route('/')
def root():
    # Open index.html
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/api/save-result', methods=['POST'])
def save_result():
    data = request.get_json()
    if not data:
        return jsonify({'ok': False, 'error': 'No JSON received'}), 400

    # Add server-side timestamp if not present
    if 'timestamp' not in data:
        data['timestamp'] = datetime.utcnow().isoformat() + 'Z'

    results = load_results()
    results.append(data)
    save_results(results)

    return jsonify({'ok': True})


@app.route('/api/results', methods=['GET'])
def get_results():
    results = load_results()
    return jsonify(results)

# =====================
# Live Quiz (Kahoot-style) in-memory backend
# =====================

# In-memory game storage (for simple classroom sessions)
games = {}

def generate_game_code(length=6):
    return "".join(random.choices(string.digits, k=length))

def generate_id(prefix="p"):
    return prefix + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


@app.route('/live_host')
def live_host():
    """Teacher host page for live quiz"""
    return send_from_directory(BASE_DIR, 'live_host.html')


@app.route('/live_join')
def live_join():
    """Student join page for live quiz"""
    return send_from_directory(BASE_DIR, 'live_join.html')


@app.route('/api/live/create_game', methods=['POST'])
def create_game():
    data = request.get_json(force=True, silent=True) or {}
    class_id = data.get('classId')
    chapter_id = data.get('chapterId')
    host_name = data.get('hostName') or 'Teacher'

    # Generate unique code
    code = None
    for _ in range(10):
        candidate = generate_game_code()
        if candidate not in games:
            code = candidate
            break
    if code is None:
        return jsonify({'ok': False, 'error': 'Could not generate game code'}), 500

    host_token = generate_id('h')
    games[code] = {
        'code': code,
        'classId': class_id,
        'chapterId': chapter_id,
        'createdAt': datetime.utcnow().isoformat() + 'Z',
        'status': 'waiting',  # waiting | in_progress | finished
        'currentQuestionIndex': -1,
        'correctIndex': None,
        'hostToken': host_token,
        'players': {}  # playerId -> {name, score, lastCorrect, answered}
    }

    return jsonify({
        'ok': True,
        'gameCode': code,
        'hostToken': host_token
    })


@app.route('/api/live/join', methods=['POST'])
def join_game():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get('gameCode') or '').strip()
    name = (data.get('playerName') or '').strip()

    game = games.get(code)
    if not game:
        return jsonify({'ok': False, 'error': 'Game not found'}), 404

    if game['status'] == 'finished':
        return jsonify({'ok': False, 'error': 'Game already finished'}), 400

    if not name:
        name = 'Player'

    player_id = generate_id('p')
    game['players'][player_id] = {
        'name': name,
        'score': 0,
        'lastCorrect': None,
        'answered': False
    }

    return jsonify({
        'ok': True,
        'playerId': player_id,
        'gameCode': code,
        'classId': game['classId'],
        'chapterId': game['chapterId'],
        'status': game['status'],
        'currentQuestionIndex': game['currentQuestionIndex']
    })


@app.route('/api/live/next_question', methods=['POST'])
def next_question():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get('gameCode') or '').strip()
    host_token = data.get('hostToken')
    q_index = data.get('questionIndex')
    correct_index = data.get('correctIndex')

    game = games.get(code)
    if not game:
        return jsonify({'ok': False, 'error': 'Game not found'}), 404

    if game['hostToken'] != host_token:
        return jsonify({'ok': False, 'error': 'Not authorized'}), 403

    try:
        q_index = int(q_index)
    except (TypeError, ValueError):
        return jsonify({'ok': False, 'error': 'Invalid question index'}), 400

    try:
        correct_index = int(correct_index)
    except (TypeError, ValueError):
        return jsonify({'ok': False, 'error': 'Invalid correct index'}), 400

    game['status'] = 'in_progress'
    game['currentQuestionIndex'] = q_index
    game['correctIndex'] = correct_index

    # Reset answered flags for new question
    for p in game['players'].values():
        p['answered'] = False
        p['lastCorrect'] = None

    return jsonify({'ok': True})


@app.route('/api/live/end_game', methods=['POST'])
def end_game():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get('gameCode') or '').strip()
    host_token = data.get('hostToken')

    game = games.get(code)
    if not game:
        return jsonify({'ok': False, 'error': 'Game not found'}), 404

    if game['hostToken'] != host_token:
        return jsonify({'ok': False, 'error': 'Not authorized'}), 403

    game['status'] = 'finished'
    return jsonify({'ok': True})


@app.route('/api/live/answer', methods=['POST'])
def submit_answer():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get('gameCode') or '').strip()
    player_id = data.get('playerId')
    selected = data.get('selectedIndex')

    game = games.get(code)
    if not game:
        return jsonify({'ok': False, 'error': 'Game not found'}), 404

    player = game['players'].get(player_id)
    if not player:
        return jsonify({'ok': False, 'error': 'Player not found'}), 404

    # If question hasn't started
    if game['currentQuestionIndex'] < 0 or game['status'] != 'in_progress':
        return jsonify({'ok': False, 'error': 'Question not active'}), 400

    # If already answered this question, ignore
    if player['answered']:
        return jsonify({'ok': True, 'alreadyAnswered': True, 'score': player['score']})

    try:
        selected = int(selected)
    except (TypeError, ValueError):
        selected = None

    is_correct = (selected == game['correctIndex'])
    player['answered'] = True
    player['lastCorrect'] = bool(is_correct)

    if is_correct:
        # Simple scoring: +1 point per correct answer
        player['score'] += 1

    return jsonify({
        'ok': True,
        'correct': is_correct,
        'score': player['score']
    })


@app.route('/api/live/state', methods=['GET'])
def game_state():
    code = request.args.get('gameCode', '').strip()
    player_id = request.args.get('playerId')  # optional

    game = games.get(code)
    if not game:
        return jsonify({'ok': False, 'error': 'Game not found'}), 404

    players_list = []
    for pid, p in game['players'].items():
        players_list.append({
            'playerId': pid,
            'name': p['name'],
            'score': p['score'],
            'answered': p['answered'],
            'lastCorrect': p['lastCorrect']
        })

    # Sort leaderboard by score desc, then name
    players_list.sort(key=lambda x: (-x['score'], x['name'].lower()))

    you = None
    if player_id and player_id in game['players']:
        p = game['players'][player_id]
        you = {
            'playerId': player_id,
            'name': p['name'],
            'score': p['score'],
            'answered': p['answered'],
            'lastCorrect': p['lastCorrect']
        }

    return jsonify({
        'ok': True,
        'gameCode': code,
        'classId': game['classId'],
        'chapterId': game['chapterId'],
        'status': game['status'],
        'currentQuestionIndex': game['currentQuestionIndex'],
        'players': players_list,
        'you': you
    })


if __name__ == '__main__':
    # Run on all interfaces (so phones on Wi-Fi can access)
    app.run(host='0.0.0.0', port=8000, debug=True)