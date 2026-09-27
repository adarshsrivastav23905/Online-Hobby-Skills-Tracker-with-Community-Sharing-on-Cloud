# ===================================================
# routes/goal_routes.py — Goal & Milestone REST API
# ===================================================
# POST /api/goals          — Create a goal with milestones
# GET  /api/goals          — Get all user's goals
# PUT  /api/goals/<id>     — Update a goal
# DELETE /api/goals/<id>   — Delete a goal
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from models import db, Goal, Milestone, Skill

goal_bp = Blueprint('goals', __name__)


@goal_bp.route('/api/goals', methods=['POST'])
@jwt_required()
def create_goal():
    """
    Create a new goal with optional milestones.
    Request: {
        skill_id, title, target_value, unit,
        deadline?, milestones?: [{ title, target_value }]
    }
    Response: { message, goal }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    skill_id = data.get('skill_id')
    title = data.get('title', '').strip()
    target_value = data.get('target_value')

    if not skill_id or not title or not target_value:
        return jsonify({'error': 'skill_id, title, and target_value are required'}), 400

    if target_value <= 0:
        return jsonify({'error': 'Target value must be positive'}), 400

    # Verify skill ownership
    skill = db.session.get(Skill, skill_id)
    if not skill or skill.user_id != user_id:
        return jsonify({'error': 'Skill not found or access denied'}), 404

    goal = Goal(
        skill_id=skill_id,
        user_id=user_id,
        title=title,
        target_value=float(target_value),
        unit=data.get('unit', 'hours'),
        status='ACTIVE'
    )

    # Parse deadline
    if data.get('deadline'):
        try:
            goal.deadline = datetime.fromisoformat(
                data['deadline'].replace('Z', '+00:00')
            )
        except (ValueError, AttributeError):
            pass

    db.session.add(goal)
    db.session.flush()  # Get goal.id before adding milestones

    # Add milestones
    milestones_data = data.get('milestones', [])
    for m in milestones_data:
        milestone = Milestone(
            goal_id=goal.id,
            title=m.get('title', ''),
            target_value=float(m.get('target_value', 0))
        )
        db.session.add(milestone)

    db.session.commit()

    return jsonify({
        'message': 'Goal created successfully',
        'goal': goal.to_dict()
    }), 201


@goal_bp.route('/api/goals', methods=['GET'])
@jwt_required()
def get_goals():
    """
    Get all goals for the authenticated user.
    Query params: ?skill_id=1&status=ACTIVE
    Response: { goals, count }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())
    query = Goal.query.filter_by(user_id=user_id)

    skill_id = request.args.get('skill_id')
    if skill_id:
        query = query.filter_by(skill_id=int(skill_id))

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status.upper())

    goals = query.order_by(Goal.created_at.desc()).all()

    return jsonify({
        'goals': [g.to_dict() for g in goals],
        'count': len(goals)
    }), 200


@goal_bp.route('/api/goals/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    """
    Update a goal.
    Request: { title?, target_value?, deadline?, status? }
    Response: { message, goal }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    goal = db.session.get(Goal, goal_id)

    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    if goal.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    if 'title' in data:
        goal.title = data['title'].strip()
    if 'target_value' in data and data['target_value'] > 0:
        goal.target_value = float(data['target_value'])
    if 'status' in data and data['status'] in ['ACTIVE', 'COMPLETED', 'ABANDONED']:
        goal.status = data['status']
    if 'deadline' in data:
        try:
            goal.deadline = datetime.fromisoformat(
                data['deadline'].replace('Z', '+00:00')
            )
        except (ValueError, AttributeError):
            pass

    db.session.commit()

    return jsonify({
        'message': 'Goal updated successfully',
        'goal': goal.to_dict()
    }), 200


@goal_bp.route('/api/goals/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    """
    Delete a goal and its milestones.
    Response: { message }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    goal = db.session.get(Goal, goal_id)

    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    if goal.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    db.session.delete(goal)
    db.session.commit()

    return jsonify({'message': 'Goal deleted successfully'}), 200
