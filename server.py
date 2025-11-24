from flask import Flask, send_from_directory, request, jsonify
import json
import os
from datetime import datetime

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


if __name__ == '__main__':
    # Run on all interfaces (so phones on Wi-Fi can access)
    app.run(host='0.0.0.0', port=8000, debug=True)
