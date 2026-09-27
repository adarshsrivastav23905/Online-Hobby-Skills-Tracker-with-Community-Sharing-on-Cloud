# ===================================================
# routes/auth_routes.py — Authentication REST API
# ===================================================
# POST /api/register  — Create new user account
# POST /api/login     — Login and get JWT token
# POST /api/logout    — Logout (client-side token removal)
# GET  /api/me        — Get current authenticated user
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from models import db, User
import re

auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Ensure password meets minimum security requirements."""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""


@auth_bp.route('/api/register', methods=['POST'])
def register():
    """
    Register a new user.
    Request: { name, username, email, password }
    Response: { message, user }
    Status: 201 Created, 400 Bad Request, 409 Conflict
    """
    data = request.get_json()

    # Input validation
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    name = data.get('name', '').strip()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([name, username, email, password]):
        return jsonify({'error': 'Name, username, email, and password are required'}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    valid, msg = validate_password(password)
    if not valid:
        return jsonify({'error': msg}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400

    # Check for duplicates
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    # Create user
    user = User(name=name, username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict(include_private=True),
        'access_token': access_token
    }), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    """
    Login with email and password.
    Request: { email, password }
    Response: { message, user, access_token }
    Status: 200 OK, 400 Bad Request, 401 Unauthorized
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_private=True),
        'access_token': access_token
    }), 200


@auth_bp.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout the current user.
    Note: JWT is stateless — client must discard the token.
    Response: { message }
    Status: 200 OK
    """
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get the currently authenticated user's profile.
    Response: { user }
    Status: 200 OK, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict(include_private=True)}), 200
