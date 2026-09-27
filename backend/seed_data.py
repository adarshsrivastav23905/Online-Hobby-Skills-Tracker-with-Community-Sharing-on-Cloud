# ===================================================
# seed_data.py — Generate Dummy/Synthetic Test Data
# ===================================================
# Creates sample users, skills, practice sessions,
# goals, milestones, and community posts for testing.
# ===================================================

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
import random
from app import create_app
from models import db, User, Skill, PracticeSession, Goal, Milestone, Post, Comment, Like


def seed():
    """Populate database with synthetic data for demonstration."""
    app = create_app()

    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        print("🌱 Seeding database with sample data...")

        # === CREATE USERS ===
        users_data = [
            {
                'name': 'Aarav Sharma', 'username': 'aarav_skills',
                'email': 'aarav@example.com', 'password': 'password123',
                'bio': 'Music enthusiast & amateur photographer. Love learning new skills!',
                'interests': 'Music,Photography,Coding'
            },
            {
                'name': 'Priya Patel', 'username': 'priya_creative',
                'email': 'priya@example.com', 'password': 'password123',
                'bio': 'Artist and fitness lover. Tracking my creative journey!',
                'interests': 'Art,Fitness,Cooking'
            },
            {
                'name': 'Rahul Verma', 'username': 'rahul_coder',
                'email': 'rahul@example.com', 'password': 'password123',
                'bio': 'Full-stack developer learning new languages and frameworks.',
                'interests': 'Coding,Chess,Language'
            },
            {
                'name': 'Sneha Gupta', 'username': 'sneha_writes',
                'email': 'sneha@example.com', 'password': 'password123',
                'bio': 'Writer, gardener, and public speaking practitioner.',
                'interests': 'Writing,Gardening,Public Speaking'
            },
            {
                'name': 'Vikram Singh', 'username': 'vikram_fit',
                'email': 'vikram@example.com', 'password': 'password123',
                'bio': 'Fitness coach and dance enthusiast. Consistency is key!',
                'interests': 'Fitness,Dance,Cooking'
            },
        ]

        users = []
        for ud in users_data:
            user = User(
                name=ud['name'], username=ud['username'],
                email=ud['email'], bio=ud['bio'], interests=ud['interests']
            )
            user.set_password(ud['password'])
            db.session.add(user)
            users.append(user)

        db.session.commit()
        print(f"  ✅ Created {len(users)} users")

        # === CREATE SKILLS ===
        skills_data = [
            # User 1 (Aarav) — Music, Photography, Coding
            {'user': 0, 'name': 'Guitar', 'category': 'Music', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
            {'user': 0, 'name': 'Portrait Photography', 'category': 'Photography', 'level': 'BEGINNER', 'target': 'ADVANCED'},
            {'user': 0, 'name': 'Python Programming', 'category': 'Coding', 'level': 'INTERMEDIATE', 'target': 'ADVANCED'},
            # User 2 (Priya) — Art, Fitness, Cooking
            {'user': 1, 'name': 'Watercolor Painting', 'category': 'Art', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
            {'user': 1, 'name': 'Yoga', 'category': 'Fitness', 'level': 'INTERMEDIATE', 'target': 'ADVANCED'},
            {'user': 1, 'name': 'Indian Cooking', 'category': 'Cooking', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
            # User 3 (Rahul) — Coding, Chess
            {'user': 2, 'name': 'React.js', 'category': 'Coding', 'level': 'BEGINNER', 'target': 'ADVANCED'},
            {'user': 2, 'name': 'Chess Strategy', 'category': 'Chess', 'level': 'INTERMEDIATE', 'target': 'ADVANCED'},
            # User 4 (Sneha) — Writing, Public Speaking
            {'user': 3, 'name': 'Creative Writing', 'category': 'Writing', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
            {'user': 3, 'name': 'Public Speaking', 'category': 'Public Speaking', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
            # User 5 (Vikram) — Fitness, Dance
            {'user': 4, 'name': 'Weight Training', 'category': 'Fitness', 'level': 'INTERMEDIATE', 'target': 'ADVANCED'},
            {'user': 4, 'name': 'Salsa Dancing', 'category': 'Dance', 'level': 'BEGINNER', 'target': 'INTERMEDIATE'},
        ]

        skills = []
        for sd in skills_data:
            skill = Skill(
                user_id=users[sd['user']].id,
                skill_name=sd['name'],
                category=sd['category'],
                current_level=sd['level'],
                target_level=sd['target'],
                description=f"Learning {sd['name']} - tracking progress from {sd['level']} to {sd['target']}",
                status='ACTIVE'
            )
            db.session.add(skill)
            skills.append(skill)

        db.session.commit()
        print(f"  ✅ Created {len(skills)} skills")

        # === CREATE PRACTICE SESSIONS ===
        activities = [
            'Practiced fundamentals', 'Worked on technique', 'Completed tutorial',
            'Free practice session', 'Reviewed theory', 'Applied concepts',
            'Group practice', 'Solo drills', 'Project work', 'Challenge practice'
        ]

        session_count = 0
        now = datetime.now(timezone.utc)

        for skill in skills:
            # 10–20 sessions per skill over the past 30 days
            num_sessions = random.randint(10, 20)
            for j in range(num_sessions):
                days_ago = random.randint(0, 30)
                practiced_at = now - timedelta(days=days_ago, hours=random.randint(0, 12))
                duration = random.choice([15, 20, 25, 30, 45, 60, 90])

                session = PracticeSession(
                    user_id=skill.user_id,
                    skill_id=skill.id,
                    duration_minutes=duration,
                    activity=random.choice(activities),
                    notes=f"Session {j + 1}: Focused on improving {skill.skill_name.lower()} skills.",
                    practiced_at=practiced_at
                )
                db.session.add(session)
                skill.total_minutes = (skill.total_minutes or 0) + duration
                session_count += 1

        db.session.commit()
        print(f"  ✅ Created {session_count} practice sessions")

        # === CREATE GOALS & MILESTONES ===
        goals_data = [
            {'skill_idx': 0, 'title': 'Practice Guitar 30 Hours', 'target': 30, 'unit': 'hours',
             'milestones': [('5 Hours', 5), ('10 Hours', 10), ('20 Hours', 20), ('30 Hours', 30)]},
            {'skill_idx': 1, 'title': 'Take 100 Portrait Photos', 'target': 100, 'unit': 'sessions',
             'milestones': [('25 Photos', 25), ('50 Photos', 50), ('75 Photos', 75), ('100 Photos', 100)]},
            {'skill_idx': 3, 'title': 'Complete 20 Paintings', 'target': 20, 'unit': 'sessions',
             'milestones': [('5 Paintings', 5), ('10 Paintings', 10), ('20 Paintings', 20)]},
            {'skill_idx': 6, 'title': 'Build 5 React Projects', 'target': 5, 'unit': 'sessions',
             'milestones': [('1st Project', 1), ('3rd Project', 3), ('5th Project', 5)]},
            {'skill_idx': 10, 'title': 'Train 50 Hours', 'target': 50, 'unit': 'hours',
             'milestones': [('10 Hours', 10), ('25 Hours', 25), ('50 Hours', 50)]},
        ]

        goal_count = 0
        for gd in goals_data:
            skill = skills[gd['skill_idx']]
            # Set current value based on existing sessions
            if gd['unit'] == 'hours':
                current = skill.total_minutes / 60.0
            else:
                current = PracticeSession.query.filter_by(skill_id=skill.id).count()

            goal = Goal(
                skill_id=skill.id,
                user_id=skill.user_id,
                title=gd['title'],
                target_value=gd['target'],
                current_value=min(current, gd['target']),
                unit=gd['unit'],
                deadline=now + timedelta(days=random.randint(30, 90)),
                status='COMPLETED' if current >= gd['target'] else 'ACTIVE'
            )
            db.session.add(goal)
            db.session.flush()

            for m_title, m_target in gd['milestones']:
                achieved = current >= m_target
                milestone = Milestone(
                    goal_id=goal.id,
                    title=m_title,
                    target_value=m_target,
                    achieved=achieved,
                    achieved_at=now - timedelta(days=random.randint(1, 15)) if achieved else None
                )
                db.session.add(milestone)

            goal_count += 1

        db.session.commit()
        print(f"  ✅ Created {goal_count} goals with milestones")

        # === CREATE COMMUNITY POSTS ===
        posts_content = [
            ("Just completed my first week of guitar practice! 🎸 Chords are getting smoother.", 0, 0),
            ("Captured an amazing sunset portrait today! 📸 Natural light is everything.", 0, 1),
            ("Finished a beautiful watercolor landscape 🎨 So proud of my progress!", 1, 3),
            ("30-day yoga streak achieved! 🧘‍♀ Feeling stronger than ever.", 1, 4),
            ("Built my first React component from scratch! 💻 The learning curve is real but worth it.", 2, 6),
            ("Won my first online chess tournament! ♟️ Strategy practice paid off.", 2, 7),
            ("Published my first short story! ✍️ Writing every day for a month changed everything.", 3, 8),
            ("Gave a 10-minute speech without notes today! 🎤 Public speaking gets easier with practice.", 3, 9),
            ("New personal record on bench press! 💪 Consistency beats intensity.", 4, 10),
            ("Learned 3 new salsa moves this week! 💃 Dance is pure joy.", 4, 11),
            ("Coded a full REST API in Python today! 🐍 Cloud computing project coming together.", 0, 2),
            ("Made homemade pasta from scratch! 🍝 Italian cooking is an art form.", 1, 5),
        ]

        posts = []
        for content, user_idx, skill_idx in posts_content:
            post = Post(
                user_id=users[user_idx].id,
                skill_id=skills[skill_idx].id,
                content=content,
                visibility='public',
                likes_count=random.randint(2, 15),
                comments_count=0,
                created_at=now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))
            )
            db.session.add(post)
            posts.append(post)

        db.session.commit()
        print(f"  ✅ Created {len(posts)} community posts")

        # === CREATE LIKES ===
        like_count = 0
        for post in posts:
            # Random users like each post
            likers = random.sample(users, k=min(post.likes_count, len(users)))
            post.likes_count = len(likers)
            for user in likers:
                like = Like(post_id=post.id, user_id=user.id)
                db.session.add(like)
                like_count += 1

        db.session.commit()
        print(f"  ✅ Created {like_count} likes")

        # === CREATE COMMENTS ===
        sample_comments = [
            "Great progress! Keep it up! 🔥",
            "This is so inspiring! 💪",
            "Amazing work! How long did this take?",
            "Love this! I want to learn too!",
            "Congrats on the milestone! 🎉",
            "Your dedication is incredible!",
            "This motivates me to practice more!",
            "Wow, impressive achievement!",
            "Keep pushing! You're doing great! ⭐",
            "This is awesome! Share more updates!",
        ]

        comment_count = 0
        for post in posts:
            num_comments = random.randint(1, 4)
            commenters = random.sample(users, k=min(num_comments, len(users)))
            for user in commenters:
                comment = Comment(
                    post_id=post.id,
                    user_id=user.id,
                    content=random.choice(sample_comments),
                    created_at=post.created_at + timedelta(hours=random.randint(1, 48))
                )
                db.session.add(comment)
                comment_count += 1
            post.comments_count = num_comments

        db.session.commit()
        print(f"  ✅ Created {comment_count} comments")

        print("\n🎉 Database seeded successfully!")
        print(f"\n📋 Test Accounts:")
        print(f"{'='*50}")
        for ud in users_data:
            print(f"  Email: {ud['email']}")
            print(f"  Password: {ud['password']}")
            print(f"  ---")


if __name__ == '__main__':
    seed()
