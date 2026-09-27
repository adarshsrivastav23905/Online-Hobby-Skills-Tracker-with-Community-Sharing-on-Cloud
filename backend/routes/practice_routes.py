# ===================================================
# routes/practice_routes.py — Practice Session REST API
# ===================================================
# POST /api/practice                 — Log a practice session
# GET  /api/practice                 — Get all practice sessions
# GET  /api/skills/<id>/practice     — Get sessions for a skill
# ===================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
from models import db, PracticeSession, Skill, Goal, Milestone

practice_bp = Blueprint('practice', __name__)


def update_streak_and_goals(user_id, skill_id, duration_minutes):
    """
    After logging a practice session:
    1. Update skill's total_minutes
    2. Update related goal progress
    3. Check and mark milestones as achieved
    """
    # Update skill total
    skill = db.session.get(Skill, skill_id)
    if skill:
        skill.total_minutes = (skill.total_minutes or 0) + duration_minutes

    # Update goals for this skill
    goals = Goal.query.filter_by(
        skill_id=skill_id, user_id=user_id, status='ACTIVE'
    ).all()

    for goal in goals:
        if goal.unit == 'hours':
            goal.current_value += duration_minutes / 60.0
        elif goal.unit == 'minutes':
            goal.current_value += duration_minutes
        elif goal.unit == 'sessions':
            goal.current_value += 1

        # Check if goal is completed
        if goal.current_value >= goal.target_value:
            goal.status = 'COMPLETED'

        # Check milestones
        for milestone in goal.milestones:
            if not milestone.achieved and goal.current_value >= milestone.target_value:
                milestone.achieved = True
                milestone.achieved_at = datetime.now(timezone.utc)

    db.session.commit()


@practice_bp.route('/api/practice', methods=['POST'])
@jwt_required()
def log_practice():
    """
    Log a new practice session.
    Request: { skill_id, duration_minutes, activity?, notes?, practiced_at? }
    Response: { message, session, updated_skill }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    skill_id = data.get('skill_id')
    duration_minutes = data.get('duration_minutes')

    if not skill_id:
        return jsonify({'error': 'Skill ID is required'}), 400
    if not duration_minutes or duration_minutes <= 0:
        return jsonify({'error': 'Duration must be a positive number'}), 400
    if duration_minutes > 1440:
        return jsonify({'error': 'Duration cannot exceed 24 hours'}), 400

    # Verify skill belongs to user
    skill = db.session.get(Skill, skill_id)
    if not skill or skill.user_id != user_id:
        return jsonify({'error': 'Skill not found or access denied'}), 404

    # Parse practice date
    practiced_at = datetime.now(timezone.utc)
    if data.get('practiced_at'):
        try:
            practiced_at = datetime.fromisoformat(
                data['practiced_at'].replace('Z', '+00:00')
            )
        except (ValueError, AttributeError):
            pass

    session = PracticeSession(
        user_id=user_id,
        skill_id=skill_id,
        duration_minutes=int(duration_minutes),
        activity=data.get('activity', '').strip(),
        notes=data.get('notes', '').strip(),
        practiced_at=practiced_at
    )

    db.session.add(session)
    db.session.commit()

    # Update streak, goals, and milestones
    update_streak_and_goals(user_id, skill_id, int(duration_minutes))

    # Refresh skill data
    skill = db.session.get(Skill, skill_id)

    return jsonify({
        'message': 'Practice session logged successfully',
        'session': session.to_dict(),
        'updated_skill': skill.to_dict()
    }), 201


@practice_bp.route('/api/practice', methods=['GET'])
@jwt_required()
def get_all_practice():
    """
    Get all practice sessions for the authenticated user.
    Query params: ?limit=20&offset=0&skill_id=1
    Response: { sessions, count, total }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())

    query = PracticeSession.query.filter_by(user_id=user_id)

    # Optional filter by skill
    skill_id = request.args.get('skill_id')
    if skill_id:
        query = query.filter_by(skill_id=int(skill_id))

    total = query.count()

    # Pagination
    limit = min(int(request.args.get('limit', 20)), 100)
    offset = int(request.args.get('offset', 0))

    sessions = query.order_by(
        PracticeSession.practiced_at.desc()
    ).limit(limit).offset(offset).all()

    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'count': len(sessions),
        'total': total
    }), 200


@practice_bp.route('/api/skills/<int:skill_id>/practice', methods=['GET'])
@jwt_required()
def get_skill_practice(skill_id):
    """
    Get practice sessions for a specific skill.
    Response: { sessions, total_minutes, session_count }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())

    # Verify ownership
    skill = db.session.get(Skill, skill_id)
    if not skill or skill.user_id != user_id:
        return jsonify({'error': 'Skill not found or access denied'}), 404

    sessions = PracticeSession.query.filter_by(
        user_id=user_id, skill_id=skill_id
    ).order_by(PracticeSession.practiced_at.desc()).all()

    total_minutes = sum(s.duration_minutes for s in sessions)

    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'total_minutes': total_minutes,
        'session_count': len(sessions)
    }), 200
