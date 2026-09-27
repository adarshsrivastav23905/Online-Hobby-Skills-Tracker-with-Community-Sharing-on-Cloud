# ===================================================
# routes/skill_routes.py — Skill Management REST API
# ===================================================
# POST   /api/skills        — Create a new skill
# GET    /api/skills        — Get all user's skills
# GET    /api/skills/<id>   — Get skill details
# PUT    /api/skills/<id>   — Update a skill
# DELETE /api/skills/<id>   — Delete a skill
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Skill

skill_bp = Blueprint('skills', __name__)

VALID_CATEGORIES = [
    'Photography', 'Music', 'Art', 'Coding', 'Fitness',
    'Cooking', 'Writing', 'Gaming', 'Language', 'Design',
    'Chess', 'Gardening', 'Dance', 'Public Speaking', 'Video Editing', 'Other'
]

VALID_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
VALID_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED']


@skill_bp.route('/api/skills', methods=['POST'])
@jwt_required()
def create_skill():
    """
    Create a new hobby/skill.
    Request: { skill_name, category, current_level?, target_level?, description?, target_date? }
    Response: { message, skill }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    skill_name = data.get('skill_name', '').strip()
    category = data.get('category', '').strip()

    if not skill_name:
        return jsonify({'error': 'Skill name is required'}), 400
    if not category:
        return jsonify({'error': 'Category is required'}), 400

    current_level = data.get('current_level', 'BEGINNER').upper()
    target_level = data.get('target_level', 'INTERMEDIATE').upper()

    if current_level not in VALID_LEVELS:
        return jsonify({'error': f'Invalid level. Must be one of: {VALID_LEVELS}'}), 400

    skill = Skill(
        user_id=user_id,
        skill_name=skill_name,
        category=category,
        current_level=current_level,
        target_level=target_level,
        description=data.get('description', ''),
        status='ACTIVE'
    )

    if data.get('target_date'):
        from datetime import datetime
        try:
            skill.target_date = datetime.fromisoformat(data['target_date'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            pass

    db.session.add(skill)
    db.session.commit()

    return jsonify({
        'message': 'Skill created successfully',
        'skill': skill.to_dict()
    }), 201


@skill_bp.route('/api/skills', methods=['GET'])
@jwt_required()
def get_my_skills():
    """
    Get all skills for the authenticated user.
    Query params: ?status=ACTIVE&category=Music
    Response: { skills, count }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())
    query = Skill.query.filter_by(user_id=user_id)

    # Optional filters
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status.upper())

    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)

    skills = query.order_by(Skill.created_at.desc()).all()

    return jsonify({
        'skills': [s.to_dict() for s in skills],
        'count': len(skills)
    }), 200


@skill_bp.route('/api/skills/<int:skill_id>', methods=['GET'])
@jwt_required()
def get_skill_details(skill_id):
    """
    Get details of a specific skill.
    Response: { skill }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    skill = db.session.get(Skill, skill_id)

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    if skill.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify({'skill': skill.to_dict()}), 200


@skill_bp.route('/api/skills/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    """
    Update a skill.
    Request: { skill_name?, category?, current_level?, target_level?, status?, description? }
    Response: { message, skill }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    skill = db.session.get(Skill, skill_id)

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    if skill.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    if 'skill_name' in data and data['skill_name'].strip():
        skill.skill_name = data['skill_name'].strip()
    if 'category' in data:
        skill.category = data['category']
    if 'current_level' in data and data['current_level'].upper() in VALID_LEVELS:
        skill.current_level = data['current_level'].upper()
    if 'target_level' in data and data['target_level'].upper() in VALID_LEVELS:
        skill.target_level = data['target_level'].upper()
    if 'status' in data and data['status'].upper() in VALID_STATUSES:
        skill.status = data['status'].upper()
    if 'description' in data:
        skill.description = data['description']

    db.session.commit()

    return jsonify({
        'message': 'Skill updated successfully',
        'skill': skill.to_dict()
    }), 200


@skill_bp.route('/api/skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    """
    Delete a skill and all related data.
    Response: { message }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    skill = db.session.get(Skill, skill_id)

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    if skill.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    db.session.delete(skill)
    db.session.commit()

    return jsonify({'message': 'Skill deleted successfully'}), 200
