# ===================================================
# routes/post_routes.py — Community Posts REST API
# ===================================================
# POST   /api/posts         — Create a community post
# GET    /api/feed           — Get the community feed
# DELETE /api/posts/<id>     — Delete own post
# POST   /api/posts/<id>/like    — Like a post
# DELETE /api/posts/<id>/like    — Unlike a post
# POST   /api/posts/<id>/comments — Add a comment
# GET    /api/posts/<id>/comments — Get comments
# DELETE /api/comments/<id>      — Delete own comment
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Post, Comment, Like, Skill

post_bp = Blueprint('posts', __name__)


@post_bp.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    """
    Create a community post.
    Request: { content, skill_id?, media_url?, visibility? }
    Response: { message, post }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Post content is required'}), 400

    if len(content) > 2000:
        return jsonify({'error': 'Post content must be under 2000 characters'}), 400

    # Verify skill if provided
    skill_id = data.get('skill_id')
    if skill_id:
        skill = db.session.get(Skill, skill_id)
        if not skill or skill.user_id != user_id:
            skill_id = None

    post = Post(
        user_id=user_id,
        skill_id=skill_id,
        content=content,
        media_url=data.get('media_url'),
        visibility=data.get('visibility', 'public')
    )

    db.session.add(post)
    db.session.commit()

    return jsonify({
        'message': 'Post created successfully',
        'post': post.to_dict(current_user_id=user_id)
    }), 201


@post_bp.route('/api/feed', methods=['GET'])
@jwt_required()
def get_feed():
    """
    Get the community feed (public posts).
    Query params: ?limit=20&offset=0&category=Music&sort=recent
    Response: { posts, count, total }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())

    query = Post.query.filter_by(visibility='public')

    # Filter by category (via skill)
    category = request.args.get('category')
    if category:
        query = query.join(Skill, Post.skill_id == Skill.id).filter(
            Skill.category == category
        )

    # Search
    search = request.args.get('search')
    if search:
        query = query.filter(Post.content.ilike(f'%{search}%'))

    total = query.count()

    # Sorting
    sort = request.args.get('sort', 'recent')
    if sort == 'popular':
        query = query.order_by(Post.likes_count.desc())
    else:
        query = query.order_by(Post.created_at.desc())

    # Pagination
    limit = min(int(request.args.get('limit', 20)), 50)
    offset = int(request.args.get('offset', 0))

    posts = query.limit(limit).offset(offset).all()

    return jsonify({
        'posts': [p.to_dict(current_user_id=user_id) for p in posts],
        'count': len(posts),
        'total': total
    }), 200


@post_bp.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """
    Delete own post.
    Response: { message }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    if post.user_id != user_id:
        return jsonify({'error': 'You can only delete your own posts'}), 403

    db.session.delete(post)
    db.session.commit()

    return jsonify({'message': 'Post deleted successfully'}), 200


# =============== LIKES ===============

@post_bp.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    """
    Like a post (one like per user per post).
    Response: { message, likes_count }
    Status: 200 OK, 409 Conflict
    """
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Check for duplicate like
    existing = Like.query.filter_by(post_id=post_id, user_id=user_id).first()
    if existing:
        return jsonify({'error': 'You already liked this post'}), 409

    like = Like(post_id=post_id, user_id=user_id)
    post.likes_count += 1

    db.session.add(like)
    db.session.commit()

    return jsonify({
        'message': 'Post liked',
        'likes_count': post.likes_count
    }), 200


@post_bp.route('/api/posts/<int:post_id>/like', methods=['DELETE'])
@jwt_required()
def unlike_post(post_id):
    """
    Remove a like from a post.
    Response: { message, likes_count }
    Status: 200 OK, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    like = Like.query.filter_by(post_id=post_id, user_id=user_id).first()
    if not like:
        return jsonify({'error': 'You have not liked this post'}), 404

    post.likes_count = max(0, post.likes_count - 1)
    db.session.delete(like)
    db.session.commit()

    return jsonify({
        'message': 'Like removed',
        'likes_count': post.likes_count
    }), 200


# =============== COMMENTS ===============

@post_bp.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    """
    Add a comment to a post.
    Request: { content }
    Response: { message, comment }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())
    post = db.session.get(Post, post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    data = request.get_json()
    content = data.get('content', '').strip()

    if not content:
        return jsonify({'error': 'Comment content is required'}), 400

    if len(content) > 500:
        return jsonify({'error': 'Comment must be under 500 characters'}), 400

    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content
    )
    post.comments_count += 1

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'message': 'Comment added',
        'comment': comment.to_dict()
    }), 201


@post_bp.route('/api/posts/<int:post_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(post_id):
    """
    Get all comments for a post.
    Response: { comments, count }
    Status: 200 OK
    """
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    comments = Comment.query.filter_by(post_id=post_id).order_by(
        Comment.created_at.asc()
    ).all()

    return jsonify({
        'comments': [c.to_dict() for c in comments],
        'count': len(comments)
    }), 200


@post_bp.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """
    Delete own comment.
    Response: { message }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    comment = db.session.get(Comment, comment_id)

    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    if comment.user_id != user_id:
        return jsonify({'error': 'You can only delete your own comments'}), 403

    # Update post comment count
    post = db.session.get(Post, comment.post_id)
    if post:
        post.comments_count = max(0, post.comments_count - 1)

    db.session.delete(comment)
    db.session.commit()

    return jsonify({'message': 'Comment deleted successfully'}), 200
