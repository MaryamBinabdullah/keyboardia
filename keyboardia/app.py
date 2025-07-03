from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    progress = db.Column(db.String(10), default="1;1")

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template("home.html")

@app.route('/guest')
def guest_mode():
    session['guest'] = True  # Mark as guest
    return redirect('/map')
    
@app.route('/map')
def world_map():
    if 'guest' in session:
        current_level = 1
        return render_template("home.html", current_level=current_level, is_guest=True)
    
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        current_level = int(user.progress.split(";")[0])
        return render_template("home.html", current_level=current_level, is_guest=False)
    
    return redirect('/login')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        user = User.query.filter_by(username=username).first()
        if not user:
            user = User(username=username)
            db.session.add(user)
            db.session.commit()
        session['user_id'] = user.id
        session.pop('guest', None)  # Exit guest mode
        return redirect('/map')

    return render_template("login.html")

@app.route('/play/level/<int:level>')
def play_level(level):
    return redirect(f"/typing?level={level}")

@app.route('/endless')
def endless_mode():
    return render_template("endless.html")

@app.route('/save_progress', methods=['POST'])
def save_progress():
    data = request.get_json()

    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        user.progress = data['progress']
        db.session.commit()

    return jsonify({"status": "saved"})

@app.route('/typing')
def typing_game():
    level = request.args.get("level", default=1, type=int)
    user = None

    if 'user_id' in session:
        user = User.query.get(session['user_id'])

    return render_template("index.html", current_level=level, user=user)
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)