# ===================================================
# routes/analytics_routes.py — Analytics Dashboard API
# ===================================================
# GET /api/analytics/dashboard — Get user dashboard stats
# ===================================================

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
from models import db, User, Skill, PracticeSession, Goal, Milestone, Post, Like, Comment

analytics_bp = Blueprint('analytics', __name__)


def calculate_streak(user_id):
    """
    Calculate the current practice streak (consecutive days).
    A streak counts consecutive days where at least one session was logged.
    """
    sessions = PracticeSession.query.filter_by(user_id=user_id).order_by(
        PracticeSession.practiced_at.desc()
    ).all()

    if not sessions:
        return 0, 0  # current_streak, longest_streak

    # Get unique practice dates
    practice_dates = sorted(set(
        s.practiced_at.date() if s.practiced_at else s.created_at.date()
        for s in sessions
    ), reverse=True)

    if not practice_dates:
        return 0, 0

    # Calculate current streak
    today = datetime.now(timezone.utc).date()
    current_streak = 0

    # Check if the most recent practice was today or yesterday
    if practice_dates[0] >= today - timedelta(days=1):
        current_streak = 1
        for i in range(1, len(practice_dates)):
            if practice_dates[i] == practice_dates[i - 1] - timedelta(days=1):
                current_streak += 1
            else:
                break
    else:
        current_streak = 0

    # Calculate longest streak
    longest_streak = 1
    current_run = 1
    sorted_dates = sorted(practice_dates)
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
            current_run += 1
            longest_streak = max(longest_streak, current_run)
        else:
            current_run = 1

    return current_streak, longest_streak


def get_weekly_practice(user_id, weeks=8):
    """Get practice minutes grouped by week for the last N weeks."""
    weekly_data = []
    today = datetime.now(timezone.utc).date()

    for i in range(weeks):
        week_start = today - timedelta(days=today.weekday() + 7 * i)
        week_end = week_start + timedelta(days=6)

        minutes = db.session.query(
            db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
        ).filter(
            PracticeSession.user_id == user_id,
            db.func.date(PracticeSession.practiced_at) >= week_start,
            db.func.date(PracticeSession.practiced_at) <= week_end
        ).scalar()

        weekly_data.append({
            'week': week_start.isoformat(),
            'label': f'Week {weeks - i}',
            'minutes': int(minutes)
        })

    weekly_data.reverse()
    return weekly_data


def get_monthly_practice(user_id, months=6):
    """Get practice minutes grouped by month for the last N months."""
    monthly_data = []
    today = datetime.now(timezone.utc).date()

    for i in range(months):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1

        from calendar import monthrange
        _, last_day = monthrange(year, month)

        month_start = datetime(year, month, 1).date()
        month_end = datetime(year, month, last_day).date()

        minutes = db.session.query(
            db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
        ).filter(
            PracticeSession.user_id == user_id,
            db.func.date(PracticeSession.practiced_at) >= month_start,
            db.func.date(PracticeSession.practiced_at) <= month_end
        ).scalar()

        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        monthly_data.append({
            'month': month_start.isoformat(),
            'label': f'{month_names[month - 1]} {year}',
            'minutes': int(minutes)
        })

    monthly_data.reverse()
    return monthly_data


def get_practice_by_skill(user_id):
    """Get total practice minutes per skill."""
    results = db.session.query(
        Skill.skill_name,
        Skill.category,
        db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
    ).join(
        PracticeSession, Skill.id == PracticeSession.skill_id
    ).filter(
        Skill.user_id == user_id
    ).group_by(
        Skill.id, Skill.skill_name, Skill.category
    ).all()

    return [
        {'skill': r[0], 'category': r[1], 'minutes': int(r[2])}
        for r in results
    ]


@analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """
    Get comprehensive dashboard analytics.
    Response: {
        overview, skills_breakdown, weekly_practice,
        monthly_practice, goals_summary, community_stats,
        recent_activity, streaks
    }
    Status: 200 OK
    """
    user_id = int(get_jwt_identity())

    # === Overview Stats ===
    total_skills = Skill.query.filter_by(user_id=user_id).count()
    active_skills = Skill.query.filter_by(user_id=user_id, status='ACTIVE').count()

    total_minutes = db.session.query(
        db.func.coalesce(db.func.sum(PracticeSession.duration_minutes), 0)
    ).filter_by(user_id=user_id).scalar()

    total_sessions = PracticeSession.query.filter_by(user_id=user_id).count()

    # Goals
    total_goals = Goal.query.filter_by(user_id=user_id).count()
    completed_goals = Goal.query.filter_by(user_id=user_id, status='COMPLETED').count()
    active_goals = Goal.query.filter_by(user_id=user_id, status='ACTIVE').count()

    # Milestones
    total_milestones = db.session.query(Milestone).join(Goal).filter(
        Goal.user_id == user_id
    ).count()
    achieved_milestones = db.session.query(Milestone).join(Goal).filter(
        Goal.user_id == user_id, Milestone.achieved == True
    ).count()

    # Streaks
    current_streak, longest_streak = calculate_streak(user_id)

    # Community stats
    posts_count = Post.query.filter_by(user_id=user_id).count()

    total_likes = db.session.query(
        db.func.coalesce(db.func.sum(Post.likes_count), 0)
    ).filter_by(user_id=user_id).scalar()

    total_comments = db.session.query(
        db.func.coalesce(db.func.sum(Post.comments_count), 0)
    ).filter_by(user_id=user_id).scalar()

    # Recent activity (last 5 sessions)
    recent_sessions = PracticeSession.query.filter_by(
        user_id=user_id
    ).order_by(PracticeSession.practiced_at.desc()).limit(5).all()

    # Most practiced skill
    most_practiced = get_practice_by_skill(user_id)
    top_skill = most_practiced[0] if most_practiced else None

    # === Build Response ===
    return jsonify({
        'overview': {
            'total_skills': total_skills,
            'active_skills': active_skills,
            'total_practice_hours': round(total_minutes / 60, 1),
            'total_practice_minutes': int(total_minutes),
            'total_sessions': total_sessions,
            'most_practiced_skill': top_skill,
        },
        'streaks': {
            'current_streak': current_streak,
            'longest_streak': longest_streak,
        },
        'goals_summary': {
            'total_goals': total_goals,
            'active_goals': active_goals,
            'completed_goals': completed_goals,
            'total_milestones': total_milestones,
            'achieved_milestones': achieved_milestones,
        },
        'community_stats': {
            'posts_count': posts_count,
            'total_likes_received': int(total_likes),
            'total_comments_received': int(total_comments),
        },
        'skills_breakdown': get_practice_by_skill(user_id),
        'weekly_practice': get_weekly_practice(user_id),
        'monthly_practice': get_monthly_practice(user_id),
        'recent_activity': [s.to_dict() for s in recent_sessions],
    }), 200
