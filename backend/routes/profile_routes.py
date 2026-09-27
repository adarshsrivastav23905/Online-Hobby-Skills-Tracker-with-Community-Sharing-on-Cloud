# ===================================================
# routes/profile_routes.py — User Profile REST API
# ===================================================
# GET  /api/profile           — Get own profile
# PUT  /api/profile           — Update own profile
# GET  /api/profile/<user_id> — Get public profile
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_own_profile():
    """
    Get the authenticated user's full profile.
    Response: { user }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict(include_private=True)}), 200


@profile_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the authenticated user's profile.
    Request: { name?, bio?, interests?, profile_picture? }
    Response: { message, user }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'bio' in data:
        user.bio = data['bio'].strip()
    if 'interests' in data:
        # Accept list or comma-separated string
        interests = data['interests']
        if isinstance(interests, list):
            user.interests = ','.join(interests)
        else:
            user.interests = interests
    if 'profile_picture' in data:
        user.profile_picture = data['profile_picture']

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict(include_private=True)
    }), 200


@profile_bp.route('/api/profile/<int:user_id>', methods=['GET'])
@jwt_required()
def get_public_profile(user_id):
    """
    Get a user's public profile by ID with skills, stats, and posts.
    Response: { user, stats, skills, recent_posts }
    Status: 200 OK, 404 Not Found
    """
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    from models import Skill, PracticeSession, Post
    skills = Skill.query.filter_by(user_id=user_id).all()
    total_minutes = db.session.query(
        db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
    ).filter_by(user_id=user_id).scalar()
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).limit(10).all()

    return jsonify({
        'user': user.to_dict(include_private=False),
        'stats': {
            'skills_count': len(skills),
            'total_practice_hours': round(total_minutes / 60, 1),
            'posts_count': len(posts),
        },
        'skills': [s.to_dict() for s in skills],
        'recent_posts': [p.to_dict() for p in posts]
    }), 200


@profile_bp.route('/api/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """
    Get all community members/peers with their public stats.
    Response: { users, count }
    Status: 200 OK
    """
    from models import Skill, PracticeSession, Post, Follow
    current_user_id = int(get_jwt_identity())
    users = User.query.all()

    result = []
    for u in users:
        skills = Skill.query.filter_by(user_id=u.id).all()
        total_minutes = db.session.query(
            db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
        ).filter_by(user_id=u.id).scalar()
        posts_count = Post.query.filter_by(user_id=u.id).count()
        followers_count = Follow.query.filter_by(following_id=u.id).count()
        following_count = Follow.query.filter_by(follower_id=u.id).count()

        result.append({
            'user': u.to_dict(include_private=False),
            'stats': {
                'skills_count': len(skills),
                'total_practice_hours': round(total_minutes / 60, 1),
                'posts_count': posts_count,
                'followers_count': followers_count,
                'following_count': following_count,
            },
            'skills': [s.to_dict() for s in skills[:4]]
        })

    return jsonify({
        'users': result,
        'count': len(result)
    }), 200
