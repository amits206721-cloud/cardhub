from flask import (
    Flask, render_template, request, redirect,
    url_for, abort, session, flash
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime
from functools import wraps
import random

app = Flask(__name__)

# Production-safe upload directory
UPLOAD_FOLDER = 'uploads/profile_pics'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

os.makedirs(os.path.join(app.static_folder or 'static', UPLOAD_FOLDER), exist_ok=True)

app.secret_key = "super-secret-cardhub-key"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "cardhub.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

def datetimefilter(value, fmt='%Y-%m-%d %H:%M:%S'):
    """Jinja2 filter to format datetime objects."""
    if value is None:
        return ''
    return value.strftime(fmt)

def ago(value):
    """Jinja2 filter to show relative time like '2 years ago'."""
    from datetime import datetime, timedelta
    
    if value is None:
        return 'Unknown'
    
    # Handle if value is already formatted string from datetimefilter
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%d')
        except ValueError:
            return 'Unknown'
    
    now = datetime.now()
    delta = now - value
    
    if delta.total_seconds() < 60:
        return "Just now"
    elif delta.total_seconds() < 3600:
        minutes = int(delta.total_seconds() / 60)
        return f"{minutes} min ago"
    elif delta.days < 1:
        hours = int(delta.total_seconds() / 3600)
        return f"{hours}h ago"
    elif delta.days < 7:
        return f"{delta.days} days ago"
    elif delta.days < 30:
        weeks = delta.days // 7
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    elif delta.days < 365:
        months = delta.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    else:
        years = delta.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"

# Register filters
app.jinja_env.filters['datetimefilter'] = datetimefilter
app.jinja_env.filters['ago'] = ago

def from_json_filter(value):
    """Jinja2 filter to safely parse JSON strings."""
    import json
    if value:
        try:
            return json.loads(value)
        except:
            return {}
    return {}

app.jinja_env.filters['cardhub.from_json'] = from_json_filter

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_pic = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reviews = db.relationship("Review", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.username}>"


class Template(db.Model):
    __tablename__ = "templates"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    thumbnail = db.Column(db.String(200), nullable=False, default="")
    bg_color = db.Column(db.String(20), nullable=False, default="#1e293b")
    bg_image = db.Column(db.String(200), nullable=True)
    title_text = db.Column(db.String(200), nullable=False)
    line1_text = db.Column(db.String(200), nullable=False)
    line2_text = db.Column(db.String(200), nullable=False)
    label_text = db.Column(db.String(200), nullable=True, default="")
    likes = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=4.7)
    review_count = db.Column(db.Integer, default=0)

    reviews = db.relationship("Review", backref="template", lazy=True)

    def __repr__(self):
        return f"<Template {self.name}>"


class Card(db.Model):
    __tablename__ = "cards"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey("templates.id"), nullable=False)
    title_text = db.Column(db.String(200), nullable=True) 
    line1_text = db.Column(db.String(200), nullable=True)
    line2_text = db.Column(db.String(200), nullable=True)
    
    label_text = db.Column(db.String(80), nullable=True)
    subtitle_text = db.Column(db.String(200), nullable=True)
    date_text = db.Column(db.String(200), nullable=True)
    bg_color = db.Column(db.String(20), nullable=False, default="#ffffff")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Style fields
    font_family = db.Column(db.String(100), nullable=True)
    title_size = db.Column(db.Integer, nullable=True, default=50)
    title_color = db.Column(db.String(20), nullable=True, default="#667eea")
    body_size = db.Column(db.Integer, nullable=True, default=18)
    body_color = db.Column(db.String(20), nullable=True, default="#cccccc")
    label_color = db.Column(db.String(20), nullable=True, default="#667eea")
    line1_color = db.Column(db.String(20), nullable=True, default="#cccccc")
    line2_color = db.Column(db.String(20), nullable=True, default="#cccccc")
    text_bold = db.Column(db.Integer, nullable=True, default=0)
    text_italic = db.Column(db.Integer, nullable=True, default=0)
    bg_image = db.Column(db.String(500), nullable=True)
    
    # Text element positions
    label_top = db.Column(db.Integer, nullable=True, default=70)
    title_top = db.Column(db.Integer, nullable=True, default=130)
    line1_top = db.Column(db.Integer, nullable=True, default=230)
    line2_top = db.Column(db.Integer, nullable=True, default=300)
    editor_state = db.Column(db.Text, nullable=True)


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    template_id = db.Column(db.Integer, db.ForeignKey("templates.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(400), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    display_name = db.Column(db.String(80), nullable=True)


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(User, uid)


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            flash("Please log in to continue.", "warning")
            return redirect(url_for("login", next=request.path))
        return f(*args, **kwargs)
    return wrapper


REVIEW_SNIPPETS = [
    "Loved the colours and layout!",
    "Perfect for WhatsApp sharing.",
    "Clean design, easy to edit.",
    "My family really liked this invite.",
    "Simple and modern, just what I needed.",
    "Fonts and spacing look very premium.",
    "Great for last-minute invites.",
]

REVIEW_NAMES = [
    "Priya", "Rahul", "Sneha", "Amit", "Neha",
    "Rohan", "Ishita", "Karan", "Ved", "Simran"
]


def attach_meta(templates):
    for t in templates:
        base_likes = t.likes or random.randint(35, 220)
        base_reviews = t.review_count or random.randint(4, 45)
        base_rating = t.rating or round(random.uniform(4.2, 4.9), 1)

        real_reviews = t.reviews
        if real_reviews:
            base_reviews = len(real_reviews)
            base_rating = round(sum(r.rating for r in real_reviews) / len(real_reviews), 1)

        t.dynamic_likes = base_likes
        t.dynamic_reviews = base_reviews
        t.dynamic_rating = base_rating
        t.sample_comment = random.choice(REVIEW_SNIPPETS)


def seed_data():
    if Template.query.count() > 0:
        return

    demo_templates = [
        Template(
            name="Blue Floral Frame",
            category="Engagement",
            thumbnail="",
            bg_color="#e0f2fe",
            title_text="Engagement Ceremony",
            line1_text="We invite you to share our joy",
            line2_text="Date • Time • Venue",
            likes=210, rating=4.9, review_count=58,
        ),
        Template(
            name="Pastel Birthday Bash",
            category="Birthday",
            thumbnail="",
            bg_color="#fde68a",
            title_text="Birthday Bash!",
            line1_text="You're invited to celebrate with us",
            line2_text="Saturday, 8 PM • Mumbai",
            likes=180, rating=4.8, review_count=42,
        ),
        Template(
            name="Kids Birthday Fun",
            category="Birthday",
            thumbnail="",
            bg_color="#bfdbfe",
            title_text="Fun-tastic Birthday!",
            line1_text="Games, cake and surprises await",
            line2_text="Sunday, 4 PM • Playzone",
            likes=150, rating=4.7, review_count=36,
        ),
        Template(
            name="Minimal Birthday Invite",
            category="Birthday",
            thumbnail="",
            bg_color="#fee2e2",
            title_text="You're Invited",
            line1_text="Join us for a simple celebration",
            line2_text="Friday, 7 PM • Home",
            likes=120, rating=4.6, review_count=28,
        ),
        Template(
            name="Elegant Birthday Night",
            category="Birthday",
            thumbnail="",
            bg_color="#0f172a",
            title_text="Birthday Dinner",
            line1_text="An intimate evening with close friends",
            line2_text="Saturday, 8 PM • Rooftop Cafe",
            likes=140, rating=4.7, review_count=34,
        ),
        Template(
            name="Elegant Wedding Invite",
            category="Wedding",
            thumbnail="",
            bg_color="#f3e8ff",
            title_text="A New Chapter",
            line1_text="Join us for the wedding of",
            line2_text="Amit & Priya",
            likes=210, rating=4.9, review_count=60,
        ),
        Template(
            name="Royal Wedding Card",
            category="Wedding",
            thumbnail="",
            bg_color="#fef3c7",
            title_text="Wedding Celebration",
            line1_text="With blessings of our families",
            line2_text="We tie the knot",
            likes=175, rating=4.8, review_count=49,
        ),
        Template(
            name="Minimal Engagement",
            category="Engagement",
            thumbnail="",
            bg_color="#e0f2fe",
            title_text="We Are Engaged",
            line1_text="Celebrate the beginning of forever",
            line2_text="Date • Time • Venue",
            likes=130, rating=4.6, review_count=30,
        ),
        Template(
            name="Baby Shower Blue",
            category="Baby Shower",
            thumbnail="",
            bg_color="#dbeafe",
            title_text="Oh Boy!",
            line1_text="A little miracle is on the way",
            line2_text="Join us for a baby shower",
            likes=110, rating=4.5, review_count=25,
        ),
        Template(
            name="Baby Shower Pink",
            category="Baby Shower",
            thumbnail="",
            bg_color="#fee2f2",
            title_text="It's a Girl!",
            line1_text="Let's shower the mom-to-be with love",
            line2_text="Date • Time • Venue",
            likes=125, rating=4.6, review_count=27,
        ),
        Template(
            name="Classic Anniversary",
            category="Anniversary",
            thumbnail="",
            bg_color="#fef9c3",
            title_text="Anniversary Celebration",
            line1_text="Celebrating years of togetherness",
            line2_text="Join us for dinner & memories",
            likes=140, rating=4.7, review_count=35,
        ),
        Template(
            name="Silver Jubilee",
            category="Anniversary",
            thumbnail="",
            bg_color="#e5e7eb",
            title_text="25 Years of Love",
            line1_text="Please join us to celebrate",
            line2_text="Our Silver Jubilee",
            likes=160, rating=4.8, review_count=40,
        ),
        Template(
            name="Corporate Meetup",
            category="Corporate",
            thumbnail="",
            bg_color="#e0f2fe",
            title_text="Networking Evening",
            line1_text="Connect • Collaborate • Grow",
            line2_text="Friday, 6 PM • Business Lounge",
            likes=100, rating=4.4, review_count=22,
        ),
        Template(
            name="Workshop Invite",
            category="Corporate",
            thumbnail="",
            bg_color="#fee2e2",
            title_text="Skill-Building Workshop",
            line1_text="Hands-on learning session",
            line2_text="Register now · Limited seats",
            likes=115, rating=4.5, review_count=24,
        ),
        Template(
            name="Diwali Celebration",
            category="Festival",
            thumbnail="",
            bg_color="#f97316",
            title_text="Diwali Get-Together",
            line1_text="Lights, sweets & smiles",
            line2_text="Let's celebrate the festival of lights",
            likes=200, rating=4.9, review_count=70,
        ),
        Template(
            name="Christmas Party",
            category="Festival",
            thumbnail="",
            bg_color="#22c55e",
            title_text="Christmas Celebration",
            line1_text="Carols, cocoa & cheer",
            line2_text="Join us for a festive evening",
            likes=150, rating=4.7, review_count=38,
        ),
        Template(
            name="New Year Bash",
            category="Festival",
            thumbnail="",
            bg_color="#0ea5e9",
            title_text="New Year Bash",
            line1_text="Goodbye old · Hello new",
            line2_text="Countdown starts at 11 PM",
            likes=220, rating=4.9, review_count=75,
        ),
        Template(
            name="Housewarming Invite",
            category="Housewarming",
            thumbnail="",
            bg_color="#bbf7d0",
            title_text="New Home, New Beginnings",
            line1_text="Come see our new place",
            line2_text="Snacks & smiles guaranteed",
            likes=130, rating=4.6, review_count=32,
        ),
        Template(
            name="Graduation Party",
            category="Graduation",
            thumbnail="",
            bg_color="#e5e7eb",
            title_text="Graduation Celebration",
            line1_text="Tossing caps & starting new journeys",
            line2_text="Party details here",
            likes=125, rating=4.5, review_count=29,
        ),
        Template(
            name="Farewell Party",
            category="Farewell",
            thumbnail="",
            bg_color="#fecaca",
            title_text="Farewell Get-Together",
            line1_text="Let's say goodbye in style",
            line2_text="Speeches · Photos · Memories",
            likes=135, rating=4.6, review_count=31,
        ),
        Template(
            name="Kitty Party Invite",
            category="Kitty Party",
            thumbnail="",
            bg_color="#f9a8d4",
            title_text="Kitty Party",
            line1_text="Fun, food & gossip",
            line2_text="Dress code: Casual chic",
            likes=118, rating=4.5, review_count=26,
        ),
        Template(
            name="Friends Get-Together",
            category="Get-Together",
            thumbnail="",
            bg_color="#bfdbfe",
            title_text="Let's Catch Up",
            line1_text="It's been too long",
            line2_text="Snacks on us, stories on you",
            likes=142, rating=4.7, review_count=33,
        ),
        Template(
            name="Haldi Ceremony",
            category="Wedding Function",
            thumbnail="",
            bg_color="#facc15",
            title_text="Haldi Ceremony",
            line1_text="Join us for haldi & happiness",
            line2_text="Wear yellow & be ready for fun",
            likes=160, rating=4.8, review_count=41,
        ),
        Template(
            name="Mehndi Night",
            category="Wedding Function",
            thumbnail="",
            bg_color="#4ade80",
            title_text="Mehndi Night",
            line1_text="Dhol, dance & mehndi",
            line2_text="Let's colour our hands & hearts",
            likes=170, rating=4.8, review_count=44,
        ),
        Template(
            name="Sangeet Evening",
            category="Wedding Function",
            thumbnail="",
            bg_color="#c4b5fd",
            title_text="Sangeet Evening",
            line1_text="Music, dance & masti",
            line2_text="Family performances all night",
            likes=165, rating=4.8, review_count=43,
        ),
        Template(
            name="Bachelor Party",
            category="Party",
            thumbnail="",
            bg_color="#111827",
            title_text="Bachelor's Night Out",
            line1_text="One last wild night",
            line2_text="Venue & time details",
            likes=155, rating=4.7, review_count=37,
        ),
    ]

    db.session.add_all(demo_templates)
    db.session.commit()


with app.app_context():
    db.create_all()
    seed_data()


# Combined context processor
@app.context_processor
def inject_globals():
    user = current_user()
    return {
        "current_user_obj": user,
        "USER_ROLE": "free"
    }


@app.route("/")
def index():
    categories = [c[0] for c in db.session.query(Template.category).distinct().all()]
    featured = Template.query.limit(12).all()
    recent = Template.query.order_by(Template.id.desc()).limit(12).all()
    attach_meta(featured + recent)
    
    # Calculate dynamic stats
    total_templates = Template.query.count()
    total_users = User.query.count()
    total_categories = len(categories)
    
    stats = {
        'total_templates': total_templates,
        'total_users': total_users,
        'total_categories': total_categories
    }
    
    return render_template("index.html", categories=categories, featured=featured, recent=recent, stats=stats)


@app.route("/templates")
def templates_gallery():
    category = request.args.get("category")
    if category:
        templates = Template.query.filter_by(category=category).all()
    else:
        templates = Template.query.all()
    categories = [c[0] for c in db.session.query(Template.category).distinct().all()]
    attach_meta(templates)
    return render_template("templates_gallery.html", templates=templates, categories=categories, active_category=category)


@app.route("/template/<int:template_id>")
def template_detail(template_id):
    tpl = Template.query.get_or_404(template_id)
    attach_meta([tpl])
    reviews = Review.query.filter_by(template_id=template_id).order_by(Review.created_at.desc()).all()
    avg_rating = None
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
    return render_template("template_detail.html", template=tpl, reviews=reviews, avg_rating=avg_rating)


@app.route("/reviews")
def reviews_page():
    reviews = Review.query.order_by(Review.created_at.desc()).limit(60).all()
    return render_template("reviews.html", reviews=reviews)


@app.route("/discover")
def discover():
    mode = request.args.get("mode", "trending")
    templates = Template.query.all()
    attach_meta(templates)

    if mode == "top-liked":
        templates_sorted = sorted(templates, key=lambda t: t.dynamic_likes, reverse=True)
        title = "Most liked templates"
    elif mode == "most-comments":
        templates_sorted = sorted(templates, key=lambda t: t.dynamic_reviews, reverse=True)
        title = "Most commented templates"
    else:
        templates_sorted = sorted(templates, key=lambda t: (t.dynamic_rating, t.dynamic_likes), reverse=True)
        title = "Trending templates"

    return render_template("discover.html", templates=templates_sorted[:24], mode=mode, title=title)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not username or not email or not password:
            flash("All fields are required.", "error")
            return redirect(url_for("register"))
        if User.query.filter((User.username == username) | (User.email == email)).first():
            flash("Username or email already exists.", "error")
            return redirect(url_for("register"))
        user = User(username=username, email=email, password_hash=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()
        session["user_id"] = user.id
        flash("Account created and logged in!", "success")
        next_url = request.args.get("next") or url_for("index")
        return redirect(next_url)
    return render_template("auth_register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username_or_email = request.form.get("username_or_email", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email.lower())
        ).first()
        if not user or not check_password_hash(user.password_hash, password):
            flash("Invalid credentials.", "error")
            return redirect(url_for("login"))
        session["user_id"] = user.id
        flash("Logged in successfully.", "success")
        next_url = request.args.get("next") or url_for("index")
        return redirect(next_url)
    return render_template("auth_login.html")


@app.route("/logout")
def logout():
    session.pop("user_id", None)
    flash("Logged out.", "info")
    return redirect(url_for("index"))


@app.route("/editor/<int:template_id>")
@login_required
def editor(template_id):
    tpl = Template.query.get_or_404(template_id)
    return render_template("editor.html", template=tpl)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/edit-profile", methods=["GET", "POST"])
@login_required
def edit_profile():
    user = current_user()
    if request.method == "POST":

        # REMOVE PROFILE  PIC (from same form)
        if request.form.get("remove_pic") == "1":
            if user.profile_pic:
                filepath = os.path.join(app.static_folder or 'static', app.config['UPLOAD_FOLDER'], user.profile_pic)
                if os.path.exists(filepath):
                    os.remove(filepath)
            user.profile_pic = None
            db.session.commit()
            flash("Profile picture removed.", "success")
            return redirect(url_for("edit_profile"))
        
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()
        
        if not username or not email:
            flash("Username and email are required.", "error")
            return render_template("edit_profile.html", user=user)

        # Check for duplicates before updating
        if username != user.username:
            if User.query.filter_by(username=username).first():
                flash("Username already taken.", "error")
                return render_template("edit_profile.html", user=user)
        
        if email != user.email:
            if User.query.filter_by(email=email).first():
                flash("Email already registered.", "error")
                return render_template("edit_profile.html", user=user)

        try:
            # Update basic fields
            user.username = username
            user.email = email

            # PASSWORD UPDATE
            if password:
                if len(password) < 6:
                    flash("Password must be at least 6 characters.", "error")
                    return render_template("edit_profile.html", user=user)
                
                user.password_hash = generate_password_hash(password)
            
            # Handle profile picture upload
            file = request.files.get("profile_pic")

            # FILE TYPE VALIDATION
            if file and file.filename:
                if not allowed_file(file.filename):
                    flash("Invalid file type. Allowed types: png, jpg, jpeg, gif, webp.", "error")
                    return render_template("edit_profile.html", user=user)
                
            # UPLOAD
            if file and file.filename and allowed_file(file.filename):
                
                # DELETE OLD IMAGE
                if user.profile_pic:
                    old_filepath = os.path.join(app.static_folder or 'static', app.config['UPLOAD_FOLDER'], user.profile_pic)
                    if os.path.exists(old_filepath):
                        os.remove(old_filepath)
                         
                filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
                filepath = os.path.join(app.static_folder or 'static', app.config['UPLOAD_FOLDER'], filename)
                
                file.save(filepath)
                user.profile_pic = filename
            
            db.session.commit()
            flash("Profile updated successfully!", "success")
            return redirect(url_for("profile"))
            
        except Exception as e:
            db.session.rollback()
            flash("Error updating profile. Please try again.", "error")
            return render_template("edit_profile.html", user=user)

    return render_template("edit_profile.html", user=user)


@app.route("/remove-profile-pic", methods=["POST"])
@login_required
def remove_profile_pic():
    user = current_user()
    try:
        # Delete existing file if exists
        if user.profile_pic:
            filepath = os.path.join(app.static_folder or 'static', app.config['UPLOAD_FOLDER'], user.profile_pic)
            if os.path.exists(filepath):
                os.remove(filepath)
        user.profile_pic = None
        db.session.commit()
        flash("Profile picture removed successfully.", "success")
    except Exception:
        flash("Error removing picture.", "error")
    
    return redirect(url_for("edit_profile"))


@app.route("/edit-card/<int:card_id>")
@login_required
def edit_card(card_id):
    user = current_user()
    card = Card.query.get_or_404(card_id)
    if card.user_id != user.id:
        flash("You don't have permission to edit this card.", "error")
        return redirect(url_for("profile"))
    template = db.session.get(Template, card.template_id)
    return render_template("editor.html", template=template, card=card)


@app.route("/delete-card/<int:card_id>", methods=["POST"])
@login_required
def delete_card(card_id):
    user = current_user()
    card = Card.query.get_or_404(card_id)
    if card.user_id != user.id:
        flash("You don't have permission to delete this card.", "error")
        return redirect(url_for("profile"))
    db.session.delete(card)
    db.session.commit()
    flash("Card deleted successfully.", "success")
    return redirect(url_for("profile"))

@app.route("/save-card/<int:template_id>", methods=["GET", "POST"])
@login_required
def save_card(template_id):
    tpl = Template.query.get_or_404(template_id)
    
    if request.method == "GET":
        return redirect(url_for("editor", template_id=template_id))
    
    user_id = session["user_id"]
    card_id = request.form.get("card_id")
    
    editor_state_json = request.form.get("editor_state", "{}")
    bg_color = request.form.get("bg_color", "#f0f0f0")
    bg_image = request.form.get("bg_image", "")
    
    try:
        state = json.loads(editor_state_json) if editor_state_json else {}
    except:
        state = {}
    
    if card_id:
        card = Card.query.filter_by(id=card_id, user_id=user_id).first_or_404()
    else:
        card = Card(user_id=user_id, template_id=tpl.id)
        db.session.add(card)
    
    card.editor_state = editor_state_json
    card.bg_color = bg_color
    card.bg_image = bg_image
    
    # --- SAFE ELEMENT MAPPING ---
    elements = state.get('elements', [])
    
    # We use .get() with a default of "" to prevent None errors
    # Element 0: Label
    card.label_text = elements[0].get('text', '') if len(elements) > 0 else (tpl.label_text or "")
    
    # Element 1: Title
    card.title_text = elements[1].get('text', '') if len(elements) > 1 else (tpl.title_text or "")
    
    # Element 2: Line 1
    card.line1_text = elements[2].get('text', '') if len(elements) > 2 else (tpl.line1_text or "")
    
    # Element 3: Line 2
    card.line2_text = elements[3].get('text', '') if len(elements) > 3 else (tpl.line2_text or "")

    # Helper for style numeric values
    def clean_val(val, default=0):
        try:
            return int(str(val).replace('px', '').replace('%', '').split('.')[0])
        except:
            return default

    # Sync styles from Title element (Element 1)
    if len(elements) > 1:
        style = elements[1].get('style', {})
        card.font_family = style.get('fontFamily', 'Playfair Display')
        card.title_size = clean_val(style.get('fontSize'), 50)
        card.title_color = style.get('color', '#ffffff')
        card.title_top = clean_val(elements[1].get('top'), 130)

    db.session.commit()
    flash("Design saved successfully!", "success")
    return redirect(url_for("profile"))


@app.route("/review/<int:template_id>", methods=["POST"])
def add_review(template_id):
    tpl = Template.query.get_or_404(template_id)
    try:
        rating = int(request.form.get("rating", "5"))
    except ValueError:
        rating = 5
    rating = max(1, min(5, rating))
    comment = request.form.get("comment", "").strip()
    display_name = None
    user = current_user()
    user_id = None
    if user:
        display_name = user.username
        user_id = user.id
    else:
        anon_name = request.form.get("name", "").strip()
        display_name = anon_name or random.choice(REVIEW_NAMES)

    if not comment:
        flash("Please write a short review.", "error")
        return redirect(url_for("template_detail", template_id=template_id))

    review = Review(
        user_id=user_id,
        template_id=tpl.id,
        rating=rating,
        comment=comment[:400],
        display_name=display_name,
    )
    db.session.add(review)
    db.session.commit()

    reviews = Review.query.filter_by(template_id=template_id).all()
    tpl.review_count = len(reviews)
    tpl.rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
    db.session.commit()

    flash("Review added. Thank you for your feedback!", "success")
    return redirect(url_for("template_detail", template_id=template_id))


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    user = current_user()

    cards = Card.query.filter_by(user_id=user.id).order_by(Card.created_at.desc()).all()

    for card in cards:
        if card.template_id:
            card.template = db.session.get(Template, card.template_id)

    user_reviews = Review.query.filter_by(user_id=user.id).order_by(Review.created_at.desc()).all()

    return render_template("profile.html", user=user, cards=cards, reviews=user_reviews)


if __name__ == "__main__":
    app.run(debug=True)

