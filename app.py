from flask import (
    Flask, render_template, request, redirect,
    url_for, abort, session, flash
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
from functools import wraps
import random

app = Flask(__name__)

app.secret_key = "super-secret-cardhub-key"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "cardhub.db")

app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///cardhub.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
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

    template = db.relationship("Template")  # Keep only ONE relationship

    title_text = db.Column(db.String(200), nullable=False)
    line1_text = db.Column(db.String(200), nullable=False)
    line2_text = db.Column(db.String(200), nullable=False)
    label_text = db.Column(db.String(80), nullable=True)
    bg_color = db.Column(db.String(20), nullable=False, default="#ffffff")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
    return User.query.get(uid)


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
    "So much better than typing in Word.",
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

    floral_frame_path = "/static/img/floral_frame.jpg"

    demo_templates = [
        Template(
            name="Blue Floral Frame",
            category="Engagement",
            thumbnail="",
            bg_color="#ffffff",
            bg_image=floral_frame_path,
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
            line1_text="You’re invited to celebrate with us",
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
            title_text="You’re Invited",
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
            title_text="It’s a Girl!",
            line1_text="Let’s shower the mom-to-be with love",
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
            line2_text="Let’s celebrate the festival of lights",
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
            line1_text="Let’s say goodbye in style",
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
            title_text="Let’s Catch Up",
            line1_text="It’s been too long",
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
            line2_text="Let’s colour our hands & hearts",
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
            title_text="Bachelor’s Night Out",
            line1_text="One last wild night",
            line2_text="Venue & time details",
            likes=155, rating=4.7, review_count=37,
        ),
    ]

    extra_categories = [
        ("Birthday", "#fee2e2"),
        ("Wedding", "#fef9c3"),
        ("Engagement", "#e0f2fe"),
        ("Baby Shower", "#fee2f2"),
        ("Anniversary", "#e5e7eb"),
        ("Festival", "#f97316"),
        ("Housewarming", "#bbf7d0"),
        ("Graduation", "#e5e7eb"),
        ("Farewell", "#fecaca"),
        ("Party", "#0f172a"),
    ]

    for cat, color in extra_categories:
        for i in range(1, 8):
            t = Template(
                name=f"{cat} Card Style {i}",
                category=cat,
                thumbnail="",
                bg_color=color,
                title_text=f"{cat} Celebration",
                line1_text="Personalise this line with your own details",
                line2_text="Date · Time · Venue",
                likes=90 + i * 3,
                rating=4.4 + (i % 3) * 0.1,
                review_count=15 + i,
            )
            demo_templates.append(t)

    db.session.add_all(demo_templates)
    db.session.commit()

    all_templates = Template.query.limit(25).all()
    for tpl in all_templates:
        for _ in range(random.randint(2, 6)):
            r = Review(
                template_id=tpl.id,
                rating=random.randint(4, 5),
                comment=random.choice(REVIEW_SNIPPETS),
                display_name=random.choice(REVIEW_NAMES),
            )
            db.session.add(r)
    db.session.commit()


with app.app_context():
    db.create_all()
    seed_data()


@app.context_processor
def inject_globals():
    return {"current_user_obj": current_user()}


@app.route("/")
def index():
    categories = [c[0] for c in db.session.query(Template.category).distinct().all()]
    featured = Template.query.limit(12).all()
    recent = Template.query.order_by(Template.id.desc()).limit(12).all()
    attach_meta(featured + recent)
    return render_template("index.html", categories=categories, featured=featured, recent=recent)


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


@app.route("/save-card/<int:template_id>", methods=["POST"])
@login_required
def save_card(template_id):

    tpl = Template.query.get_or_404(template_id)
    card_id = request.form.get("card_id")

    title = request.form.get("title", tpl.title_text)
    line1 = request.form.get("line1", tpl.line1_text)
    line2 = request.form.get("line2", tpl.line2_text)
    label = request.form.get("label", "Custom invitation")
    bg = request.form.get("bg", tpl.bg_color)

    # ===== UPDATE EXISTING CARD =====
    if card_id:
        card = Card.query.get(card_id)
        if card and card.user_id == session.get("user_id"):
            card.title_text = title
            card.line1_text = line1
            card.line2_text = line2
            card.label_text = label
            card.bg_color = bg
            db.session.commit()
            flash("Card updated successfully.", "success")
            return redirect(url_for("profile"))

    # ===== CREATE NEW CARD =====
    card = Card(
        user_id=session["user_id"],
        template_id=tpl.id,
        title_text=title,
        line1_text=line1,
        line2_text=line2,
        label_text=label,
        bg_color=bg,
    )
    db.session.add(card)
    db.session.commit()

    flash("Card saved to your profile.", "success")
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
    if user:
        display_name = user.username
    else:
        anon_name = request.form.get("name", "").strip()
        display_name = anon_name or random.choice(REVIEW_NAMES)

    if not comment:
        flash("Please write a short review.", "error")
        return redirect(url_for("template_detail", template_id=template_id))

    review = Review(
        user_id=user.id if user else None,
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


@app.route("/profile")
@login_required
def profile():
    user = current_user()
    cards = Card.query.filter_by(user_id=user.id).order_by(Card.created_at.desc()).all()
    user_reviews = Review.query.filter_by(user_id=user.id).order_by(Review.created_at.desc()).all()
    return render_template(
        "profile.html",
        user=user,
        cards=cards,
        reviews=user_reviews,
    )
@app.route("/edit-profile", methods=["GET", "POST"])
@login_required
def edit_profile():
    user = current_user()

    if request.method == "POST":
        new_username = request.form.get("username", "").strip()
        new_email = request.form.get("email", "").strip().lower()
        new_password = request.form.get("password", "").strip()

        if not new_username or not new_email:
            flash("Username and email cannot be empty.", "error")
            return redirect(url_for("edit_profile"))

        existing_user = User.query.filter(
            ((User.username == new_username) | (User.email == new_email)) &
            (User.id != user.id)
        ).first()

        if existing_user:
            flash("Username or email already in use.", "error")
            return redirect(url_for("edit_profile"))

        user.username = new_username
        user.email = new_email

        if new_password:
            user.password_hash = generate_password_hash(new_password)

        db.session.commit()
        flash("Profile updated successfully.", "success")
        return redirect(url_for("profile"))

    return render_template("edit_profile.html", user=user)
@app.route("/edit-card/<int:card_id>")
@login_required
def edit_card(card_id):

    card = Card.query.get_or_404(card_id)

    if card.user_id != session.get("user_id"):
        abort(403)

    template = Template.query.get(card.template_id)

    return render_template(
        "editor.html",
        template=template,
        card=card
    )

@app.context_processor
def inject_role():
    return dict(USER_ROLE="free")


@app.route("/delete-card/<int:card_id>", methods=["POST"])
@login_required
def delete_card(card_id):
    card = Card.query.get_or_404(card_id)

    if card.user_id != session.get("user_id"):
        abort(403)

    db.session.delete(card)
    db.session.commit()
    flash("Card deleted successfully.", "info")
    return redirect(url_for("profile"))

if __name__ == "__main__":
    app.run(debug=True)