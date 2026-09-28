# ===================================================
# models.py — Database Models (SQLAlchemy ORM)
# ===================================================
# Defines all database tables: Users, Skills, Goals,
# Milestones, PracticeSessions, Posts, Comments, Likes,
# Follows, Files, Notifications
# ===================================================

from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """User account and profile information."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    profile_picture = db.Column(db.String(500), default=None)
    bio = db.Column(db.Text, default='')
    interests = db.Column(db.Text, default='')  # Comma-separated interests
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    skills = db.relationship('Skill', backref='user', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('PracticeSession', backref='user', lazy=True, cascade='all, delete-orphan')
    posts = db.relationship('Post', backref='author', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and store the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify a password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_private=False):
        """Serialize user to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'username': self.username,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'interests': self.interests.split(',') if self.interests else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data['email'] = self.email
            data['is_active'] = self.is_active
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
        return data


class Skill(db.Model):
    """User's hobbies and skills."""
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    current_level = db.Column(db.String(20), default='BEGINNER')  # BEGINNER, INTERMEDIATE, ADVANCED
    target_level = db.Column(db.String(20), default='INTERMEDIATE')
    start_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    target_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, PAUSED, COMPLETED
    description = db.Column(db.Text, default='')
    total_minutes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    goals = db.relationship('Goal', backref='skill', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('PracticeSession', backref='skill', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_name': self.skill_name,
            'category': self.category,
            'current_level': self.current_level,
            'target_level': self.target_level,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'status': self.status,
            'description': self.description,
            'total_minutes': self.total_minutes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Goal(db.Model):
    """Goals linked to skills."""
    __tablename__ = 'goals'

    id = db.Column(db.Integer, primary_key=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, default=0)
    unit = db.Column(db.String(50), default='hours')
    deadline = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, COMPLETED, ABANDONED
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    milestones = db.relationship('Milestone', backref='goal', lazy=True, cascade='all, delete-orphan')

    def progress_percent(self):
        if self.target_value <= 0:
            return 0
        return min(100, round((self.current_value / self.target_value) * 100, 1))

    def to_dict(self):
        return {
            'id': self.id,
            'skill_id': self.skill_id,
            'user_id': self.user_id,
            'title': self.title,
            'target_value': self.target_value,
            'current_value': self.current_value,
            'unit': self.unit,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'progress_percent': self.progress_percent(),
            'milestones': [m.to_dict() for m in self.milestones],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Milestone(db.Model):
    """Milestones within a goal."""
    __tablename__ = 'milestones'

    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('goals.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    achieved = db.Column(db.Boolean, default=False)
    achieved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'title': self.title,
            'target_value': self.target_value,
            'achieved': self.achieved,
            'achieved_at': self.achieved_at.isoformat() if self.achieved_at else None,
        }


class PracticeSession(db.Model):
    """Individual practice session logs."""
    __tablename__ = 'practice_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    activity = db.Column(db.String(200), default='')
    notes = db.Column(db.Text, default='')
    practiced_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.skill_name if self.skill else None,
            'duration_minutes': self.duration_minutes,
            'activity': self.activity,
            'notes': self.notes,
            'practiced_at': self.practiced_at.isoformat() if self.practiced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Post(db.Model):
    """Community posts shared by users."""
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.String(500), nullable=True)
    visibility = db.Column(db.String(20), default='public')  # public, followers
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    skill = db.relationship('Skill', foreign_keys=[skill_id], backref='posts')
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='post', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, current_user_id=None):
        liked_by_current = False
        if current_user_id:
            liked_by_current = any(l.user_id == current_user_id for l in self.likes)
        return {
            'id': self.id,
            'user_id': self.user_id,
            'author': self.author.to_dict() if self.author else None,
            'skill_id': self.skill_id,
            'skill_name': self.skill.skill_name if self.skill_id and self.skill else None,
            'content': self.content,
            'media_url': self.media_url,
            'visibility': self.visibility,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'liked_by_current_user': liked_by_current,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Comment(db.Model):
    """Comments on community posts."""
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'author': self.author.to_dict() if self.author else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Like(db.Model):
    """Likes on community posts (one per user per post)."""
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Prevent duplicate likes
    __table_args__ = (db.UniqueConstraint('post_id', 'user_id', name='unique_like'),)

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Follow(db.Model):
    """User follow relationships."""
    __tablename__ = 'follows'

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Prevent duplicate follows
    __table_args__ = (db.UniqueConstraint('follower_id', 'following_id', name='unique_follow'),)

    follower = db.relationship('User', foreign_keys=[follower_id], backref='following_rel')
    following = db.relationship('User', foreign_keys=[following_id], backref='followers_rel')


class FileUpload(db.Model):
    """Track uploaded files and their storage references."""
    __tablename__ = 'file_uploads'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # image, document, video
    file_size = db.Column(db.Integer, default=0)
    purpose = db.Column(db.String(50), default='general')  # profile, achievement, post
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    uploader = db.relationship('User', backref='files')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'purpose': self.purpose,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
