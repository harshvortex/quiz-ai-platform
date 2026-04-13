import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import requests

# App Configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-12345')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Dependencies
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
CORS(app, supports_credentials=True)

# Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    quizzes = db.relationship('QuizResult', backref='author', lazy=True)

class QuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    @property
    def percentage(self):
        return round((self.score / self.total_questions) * 100) if self.total_questions > 0 else 0

    @property
    def grade(self):
        p = self.percentage
        if p >= 90: return 'A+'
        if p >= 80: return 'A'
        if p >= 70: return 'B'
        if p >= 60: return 'C'
        if p >= 50: return 'D'
        return 'F'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize Database
with app.app_context():
    db.create_all()

# --- Auth Routes ---
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed_pw)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    return jsonify({'message': 'User created', 'user': {'username': user.username, 'email': user.email}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter((User.username == data['identifier']) | (User.email == data['identifier'])).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        login_user(user, remember=data.get('remember', False))
        return jsonify({'message': 'Logged in', 'user': {'username': user.username, 'email': user.email}})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'})

@app.route('/api/auth/me', methods=['GET'])
def me():
    if current_user.is_authenticated:
        return jsonify({'user': {'username': current_user.username, 'email': current_user.email}})
    return jsonify({'user': None}), 200

# --- Dashboard & Quiz Routes ---
@app.route('/api/dashboard', methods=['GET'])
@login_required
def dashboard():
    results = QuizResult.query.filter_by(user_id=current_user.id).order_by(QuizResult.date.desc()).all()
    
    stats = {
        'total': len(results),
        'average': round(sum([r.percentage for r in results]) / len(results)) if results else 0,
        'best': max([r.percentage for r in results]) if results else 0
    }
    
    recent = [{
        'topic': r.topic,
        'difficulty': r.difficulty,
        'score': r.score,
        'total_questions': r.total_questions,
        'percentage': r.percentage,
        'grade': r.grade,
        'date': r.date.isoformat()
    } for r in results[:5]]
    
    chart_data = [{
        'topic': r.topic,
        'percentage': r.percentage
    } for r in reversed(results[:10])]
    
    # Simple recommendation logic
    recommendations = []
    if results:
        low_score_topics = [r.topic for r in results if r.percentage < 70]
        recommendations = list(set(low_score_topics))[:3]

    return jsonify({
        'stats': stats,
        'recent': recent,
        'chart_data': chart_data,
        'recommendations': recommendations
    })

@app.route('/api/generate-quiz', methods=['POST'])
@login_required
def generate_quiz():
    data = request.get_json()
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    
    if not GROQ_API_KEY:
        return jsonify({'error': 'AI configuration missing'}), 500

    topic = data.get('topic', 'General')
    num = data.get('num_questions', 5)
    diff = data.get('difficulty', 'medium')
    persona = data.get('persona', 'professional')
    mode = data.get('mode', 'topic')
    context = data.get('context', '')

    system_prompt = f"You are a {persona} quiz generator. Generate a {num}-question multiple-choice quiz about {topic} at {diff} difficulty level. Output ONLY pure JSON."
    if mode == 'study':
        system_prompt += f" Use this context: {context}"

    user_prompt = "Format: { \"topic\": \"...\", \"questions\": [ { \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"...\", \"explanation\": \"...\" } ] }"

    try:
        response = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.1-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"}
            },
            timeout=30
        )
        quiz_json = response.json()['choices'][0]['message']['content']
        return jsonify(json.loads(quiz_json))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-quiz', methods=['POST'])
@login_required
def save_quiz():
    data = request.get_json()
    result = QuizResult(
        topic=data['topic'],
        difficulty=data['difficulty'],
        score=data['score'],
        total_questions=data['total_questions'],
        user_id=current_user.id
    )
    db.session.add(result)
    db.session.commit()
    return jsonify({'message': 'Saved successfully'})

@app.route('/api/history', methods=['GET'])
@login_required
def history():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    pagination = QuizResult.query.filter_by(user_id=current_user.id).order_by(QuizResult.date.desc()).paginate(page=page, per_page=per_page)
    
    quizzes = [{
        'topic': r.topic,
        'difficulty': r.difficulty,
        'score': r.score,
        'total_questions': r.total_questions,
        'percentage': r.percentage,
        'grade': r.grade,
        'date': r.date.isoformat()
    } for r in pagination.items]
    
    return jsonify({
        'quizzes': quizzes,
        'has_more': pagination.has_next
    })

if __name__ == '__main__':
    app.run(debug=True)