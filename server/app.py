from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, QuizHistory
from config import Config
import requests
import json
import re
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.config.from_object(Config)

# Rate Limiter setup (protects against API abuse)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

@app.context_processor
def inject_now():
    from datetime import datetime
    return {'now': datetime.utcnow()}


# ── Auth Routes ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        if not all([username, email, password, confirm]):
            flash('All fields are required.', 'error')
            return render_template('signup.html')

        if len(username) < 3 or len(username) > 30:
            flash('Username must be between 3 and 30 characters.', 'error')
            return render_template('signup.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('signup.html')

        if password != confirm:
            flash('Passwords do not match.', 'error')
            return render_template('signup.html')

        if User.query.filter_by(username=username).first():
            flash('Username already taken. Please choose another.', 'error')
            return render_template('signup.html')

        if User.query.filter_by(email=email).first():
            flash('An account with this email already exists.', 'error')
            return render_template('signup.html')

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        login_user(user)
        flash(f'Welcome to QuizAI, {username}!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        identifier = request.form.get('identifier', '').strip()
        password = request.form.get('password', '')
        remember = request.form.get('remember') == 'on'

        if not identifier or not password:
            flash('Please fill in all fields.', 'error')
            return render_template('login.html')

        user = User.query.filter(
            (User.username == identifier) | (User.email == identifier.lower())
        ).first()

        if user and user.check_password(password):
            login_user(user, remember=remember)
            return redirect(url_for('dashboard'))

        flash('Invalid credentials.', 'error')

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out.', 'info')
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    stats = current_user.get_stats()
    all_history = QuizHistory.query.filter_by(user_id=current_user.id).order_by(QuizHistory.date.desc()).all()
    
    # Logic for recommendations (Topics with score < 70%)
    weak_topics = []
    seen = set()
    for q in all_history:
        if q.percentage < 70 and q.topic not in seen:
            weak_topics.append(q.topic)
            seen.add(q.topic)
        if len(weak_topics) >= 3: break

    chart_data = [q.to_dict() for q in all_history[:10][::-1]]
    return render_template('dashboard.html', 
                         stats=stats, 
                         recent=all_history[:5], 
                         chart_data=chart_data,
                         recommendations=weak_topics)


@app.route('/quiz')
@login_required
def quiz():
    return render_template('quiz.html')


@app.route('/history')
@login_required
def history():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    pagination = QuizHistory.query.filter_by(user_id=current_user.id)\
        .order_by(QuizHistory.date.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    return render_template('history.html', pagination=pagination)


@app.route('/api/generate-quiz', methods=['POST'])
@login_required
@limiter.limit("5 per hour")
def generate_quiz():
    data = request.get_json()
    mode = data.get('mode', 'topic')
    topic = data.get('topic', '').strip()
    context = data.get('context', '').strip()
    num_questions = int(data.get('num_questions', 5))
    difficulty = data.get('difficulty', 'medium')
    persona = data.get('persona', 'professional')

    persona_map = {
        'professional': "a distinguished academic professor who is clear and encouraging",
        'supportive': "a high-energy motivational coach who uses positive reinforcement and emojis",
        'sarcastic': " a witty, slightly cynical AI who makes funny remarks about human intelligence",
        'medieval': "a wise medieval knight from the 14th century using 'thou', 'thee', and 'verily'"
    }
    persona_desc = persona_map.get(persona, persona_map['professional'])

    if mode == 'topic' and not topic:
        return jsonify({'error': 'Topic is required'}), 400
    if mode == 'study' and not context:
        return jsonify({'error': 'Study material is required'}), 400

    api_key = app.config['GROQ_API_KEY']
    if not api_key:
        return jsonify({'error': 'GROQ_API_KEY is not configured. Please add it to your .env file.'}), 500

    if mode == 'study':
        system_msg = f"Act as {persona_desc}. YOU MUST ONLY RESPONSE IN JSON."
        prompt = f"""
        TASK: Generate {num_questions} MCQs strictly from the text below.
        TEXT: {context[:4000]}
        DIFFICULTY: {difficulty}
        
        JSON STRUCTURE:
        {{
          "questions": [
            {{
              "question": "Concise question (max 20 words)",
              "options": ["A", "B", "C", "D"],
              "answer": "Correct option string",
              "explanation": "Brief reasoning (max 25 words)",
              "mnemonic": "Punchy memory aid (max 10 words)"
            }}
          ]
        }}
        
        RULES: No markdown. No conversational filler. Just the array. Use persona tone.
        """
        display_topic = "Study Material"
    else:
        system_msg = f"Act as {persona_desc}. YOU MUST ONLY RESPONSE IN JSON."
        prompt = f"""
        TASK: Generate {num_questions} MCQs on topic: {topic}.
        DIFFICULTY: {difficulty}
        
        JSON STRUCTURE:
        {{
          "questions": [
            {{
              "question": "Concise question (max 20 words)",
              "options": ["A", "B", "C", "D"],
              "answer": "Correct option string",
              "explanation": "Brief reasoning (max 25 words)",
              "mnemonic": "Punchy memory aid (max 10 words)"
            }}
          ]
        }}
        
        RULES: No markdown. No conversational filler. Just the array. Use persona tone.
        """
        display_topic = topic

    try:
        response = requests.post(
            app.config['GROQ_API_URL'],
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'model': app.config['GROQ_MODEL'],
                'messages': [
                    {'role': 'system', 'content': system_msg},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.6, # Lower temperature for better accuracy/consistency
                'response_format': {'type': 'json_object'} # Enforce JSON mode if supported
            },
            timeout=20
        )
        response.raise_for_status()
        
        content = response.json()['choices'][0]['message']['content']
        
        # Fast parse
        raw_data = json.loads(content)
        questions = raw_data.get('questions', raw_data) # Fallback to root if not wrapped

        return jsonify({
            'questions': questions,
            'topic': display_topic,
            'difficulty': difficulty
        })
        
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return jsonify({'error': 'Failed to generate quiz. Please try again later.'}), 500


@app.route('/api/save-quiz', methods=['POST'])
@login_required
def save_quiz():
    data = request.get_json()

    quiz = QuizHistory(
        user_id=current_user.id,
        topic=data['topic'],
        difficulty=data['difficulty'],
        score=data['score'],
        total_questions=data['total_questions']
    )

    db.session.add(quiz)
    db.session.commit()

    return jsonify({'message': 'Saved'})

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

@app.errorhandler(429)
def ratelimit_error(error):
    return jsonify({'error': f'Rate limit exceeded. Too many requests. Please take a break and try again later!'}), 429

if __name__ == '__main__':
    app.run(debug=True)