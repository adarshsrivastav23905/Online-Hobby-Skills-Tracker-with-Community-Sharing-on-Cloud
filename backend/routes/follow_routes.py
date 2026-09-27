# ===================================================
# routes/follow_routes.py — Follow System REST API
# ===================================================
# POST   /api/users/<id>/follow   — Follow a user
# DELETE /api/users/<id>/follow   — Unfollow a user
# GET    /api/users/<id>/followers — Get user's followers
# GET    /api/users/<id>/following — Get who user follows
# ===================================================

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Follow, User

follow_bp = Blueprint('follows', __name__)


@follow_bp.route('/api/users/<int:target_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(target_id):
    """
    Follow another user.
    Response: { message }
    Status: 200 OK, 400 Bad Request, 409 Conflict
    """
    user_id = int(get_jwt_identity())

    if user_id == target_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400

    target = db.session.get(User, target_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    existing = Follow.query.filter_by(
        follower_id=user_id, following_id=target_id
    ).first()

    if existing:
        return jsonify({'error': 'Already following this user'}), 409

    follow = Follow(follower_id=user_id, following_id=target_id)
    db.session.add(follow)
    db.session.commit()

    return jsonify({'message': f'Now following {target.username}'}), 200


@follow_bp.route('/api/users/<int:target_id>/follow', methods=['DELETE'])
@jwt_required()
def unfollow_user(target_id):
    """
    Unfollow a user.
    Response: { message }
    Status: 200 OK, 404 Not Found
    """
    user_id = int(get_jwt_identity())

    follow = Follow.query.filter_by(
        follower_id=user_id, following_id=target_id
    ).first()

    if not follow:
        return jsonify({'error': 'Not following this user'}), 404

    db.session.delete(follow)
    db.session.commit()

    return jsonify({'message': 'Unfollowed successfully'}), 200


@follow_bp.route('/api/users/<int:target_id>/followers', methods=['GET'])
@jwt_required()
def get_followers(target_id):
    """
    Get a user's followers.
    Response: { followers, count }
    """
    follows = Follow.query.filter_by(following_id=target_id).all()
    followers = [db.session.get(User, f.follower_id).to_dict() for f in follows if db.session.get(User, f.follower_id)]

    return jsonify({
        'followers': followers,
        'count': len(followers)
    }), 200


@follow_bp.route('/api/users/<int:target_id>/following', methods=['GET'])
@jwt_required()
def get_following(target_id):
    """
    Get who a user is following.
    Response: { following, count }
    """
    follows = Follow.query.filter_by(follower_id=target_id).all()
    following = [db.session.get(User, f.following_id).to_dict() for f in follows if db.session.get(User, f.following_id)]

    return jsonify({
        'following': following,
        'count': len(following)
    }), 200
