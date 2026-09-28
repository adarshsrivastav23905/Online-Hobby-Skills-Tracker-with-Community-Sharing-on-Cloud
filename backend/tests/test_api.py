# ===================================================
# tests/test_api.py — Automated API Tests
# ===================================================
# Tests all 27 scenarios from the testing strategy.
# Run: python -m pytest tests/test_api.py -v
# ===================================================

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
import json
from app import create_app
from models import db


@pytest.fixture
def client():
    """Create test client with temporary database."""
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
    })

    with app.app_context():
        db.create_all()
        with app.test_client() as client:
            yield client
        db.session.remove()
        db.drop_all()


@pytest.fixture
def auth_headers(client):
    """Register a user and return auth headers."""
    response = client.post('/api/register', json={
        'name': 'Test User',
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    data = json.loads(response.data)
    if 'access_token' in data:
        token = data['access_token']
    else:
        login_res = client.post('/api/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        token = json.loads(login_res.data)['access_token']
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


@pytest.fixture
def second_user_headers(client):
    """Register a second user and return auth headers."""
    response = client.post('/api/register', json={
        'name': 'Second User',
        'username': 'seconduser',
        'email': 'second@example.com',
        'password': 'password123'
    })
    data = json.loads(response.data)
    if 'access_token' in data:
        token = data['access_token']
    else:
        login_res = client.post('/api/login', json={
            'email': 'second@example.com',
            'password': 'password123'
        })
        token = json.loads(login_res.data)['access_token']
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


# ========== TEST 1: User Registration ==========
def test_01_user_registration(client):
    """TC-01: Successful user registration."""
    response = client.post('/api/register', json={
        'name': 'New User',
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'access_token' in data
    assert data['user']['username'] == 'newuser'


# ========== TEST 2: Duplicate Registration ==========
def test_02_duplicate_registration(client):
    """TC-02: Duplicate email should fail."""
    client.post('/api/register', json={
        'name': 'User A', 'username': 'usera',
        'email': 'dup@example.com', 'password': 'password123'
    })
    response = client.post('/api/register', json={
        'name': 'User B', 'username': 'userb',
        'email': 'dup@example.com', 'password': 'password123'
    })
    assert response.status_code == 409


# ========== TEST 3: Valid Login ==========
def test_03_valid_login(client):
    """TC-03: Login with correct credentials."""
    client.post('/api/register', json={
        'name': 'Login User', 'username': 'loginuser',
        'email': 'login@example.com', 'password': 'password123'
    })
    response = client.post('/api/login', json={
        'email': 'login@example.com', 'password': 'password123'
    })
    assert response.status_code == 200
    assert 'access_token' in json.loads(response.data)


# ========== TEST 4: Invalid Login ==========
def test_04_invalid_login(client):
    """TC-04: Login with wrong password."""
    client.post('/api/register', json={
        'name': 'User', 'username': 'user',
        'email': 'wrong@example.com', 'password': 'password123'
    })
    response = client.post('/api/login', json={
        'email': 'wrong@example.com', 'password': 'wrongpass'
    })
    assert response.status_code == 401


# ========== TEST 5: Profile Update ==========
def test_05_profile_update(client, auth_headers):
    """TC-05: Update user profile."""
    response = client.put('/api/profile', headers=auth_headers, json={
        'name': 'Updated Name',
        'bio': 'Updated bio text',
        'interests': ['Music', 'Art']
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['name'] == 'Updated Name'
    assert data['user']['bio'] == 'Updated bio text'


# ========== TEST 6: Add Skill ==========
def test_06_add_skill(client, auth_headers):
    """TC-06: Create a new skill."""
    response = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Guitar',
        'category': 'Music',
        'current_level': 'BEGINNER',
        'target_level': 'INTERMEDIATE',
        'description': 'Learning acoustic guitar'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['skill']['skill_name'] == 'Guitar'


# ========== TEST 7: Update Skill ==========
def test_07_update_skill(client, auth_headers):
    """TC-07: Update an existing skill."""
    # Create skill first
    create_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Python', 'category': 'Coding'
    })
    skill_id = json.loads(create_resp.data)['skill']['id']

    response = client.put(f'/api/skills/{skill_id}', headers=auth_headers, json={
        'current_level': 'INTERMEDIATE'
    })
    assert response.status_code == 200
    assert json.loads(response.data)['skill']['current_level'] == 'INTERMEDIATE'


# ========== TEST 8: Delete Skill ==========
def test_08_delete_skill(client, auth_headers):
    """TC-08: Delete a skill."""
    create_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Chess', 'category': 'Chess'
    })
    skill_id = json.loads(create_resp.data)['skill']['id']

    response = client.delete(f'/api/skills/{skill_id}', headers=auth_headers)
    assert response.status_code == 200

    get_resp = client.get(f'/api/skills/{skill_id}', headers=auth_headers)
    assert get_resp.status_code == 404


# ========== TEST 9: Create Goal ==========
def test_09_create_goal(client, auth_headers):
    """TC-09: Create a goal with milestones."""
    # Create skill first
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Guitar', 'category': 'Music'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    response = client.post('/api/goals', headers=auth_headers, json={
        'skill_id': skill_id,
        'title': 'Practice 30 Hours',
        'target_value': 30,
        'unit': 'hours',
        'milestones': [
            {'title': '10 Hours', 'target_value': 10},
            {'title': '20 Hours', 'target_value': 20},
            {'title': '30 Hours', 'target_value': 30}
        ]
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert len(data['goal']['milestones']) == 3


# ========== TEST 10: Log Practice Session ==========
def test_10_log_practice(client, auth_headers):
    """TC-10: Log a practice session."""
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Photography', 'category': 'Photography'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    response = client.post('/api/practice', headers=auth_headers, json={
        'skill_id': skill_id,
        'duration_minutes': 60,
        'activity': 'Portrait photography',
        'notes': 'Practiced natural light composition'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['session']['duration_minutes'] == 60


# ========== TEST 11: Progress Calculation ==========
def test_11_progress_calculation(client, auth_headers):
    """TC-11: Verify progress calculation after practice."""
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Coding', 'category': 'Coding'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    # Create goal: 10 hours
    goal_resp = client.post('/api/goals', headers=auth_headers, json={
        'skill_id': skill_id, 'title': 'Code 10h', 'target_value': 10, 'unit': 'hours'
    })
    goal_id = json.loads(goal_resp.data)['goal']['id']

    # Log 3 hours of practice (180 minutes)
    client.post('/api/practice', headers=auth_headers, json={
        'skill_id': skill_id, 'duration_minutes': 180
    })

    # Check goal progress
    goals_resp = client.get('/api/goals', headers=auth_headers)
    goals = json.loads(goals_resp.data)['goals']
    goal = next(g for g in goals if g['id'] == goal_id)
    assert goal['progress_percent'] == 30.0  # 3/10 * 100


# ========== TEST 12: Milestone Completion ==========
def test_12_milestone_completion(client, auth_headers):
    """TC-12: Milestone should be marked as achieved."""
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Writing', 'category': 'Writing'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    goal_resp = client.post('/api/goals', headers=auth_headers, json={
        'skill_id': skill_id, 'title': 'Write 1h', 'target_value': 1, 'unit': 'hours',
        'milestones': [{'title': '30 min', 'target_value': 0.5}]
    })
    goal_id = json.loads(goal_resp.data)['goal']['id']

    # Log 45 minutes (0.75 hours > 0.5 milestone)
    client.post('/api/practice', headers=auth_headers, json={
        'skill_id': skill_id, 'duration_minutes': 45
    })

    goals_resp = client.get('/api/goals', headers=auth_headers)
    goals = json.loads(goals_resp.data)['goals']
    goal = next(g for g in goals if g['id'] == goal_id)
    assert goal['milestones'][0]['achieved'] is True


# ========== TEST 13: File Upload ==========
def test_13_file_upload(client, auth_headers):
    """TC-13: Upload a valid image file."""
    import io
    data = {
        'file': (io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100), 'test.png'),
        'purpose': 'achievement'
    }
    response = client.post(
        '/api/files/upload',
        headers={'Authorization': auth_headers['Authorization']},
        data=data,
        content_type='multipart/form-data'
    )
    assert response.status_code == 201


# ========== TEST 14: Invalid File Upload ==========
def test_14_invalid_file(client, auth_headers):
    """TC-14: Upload disallowed file type should fail."""
    import io
    data = {
        'file': (io.BytesIO(b'malicious content'), 'malware.exe'),
    }
    response = client.post(
        '/api/files/upload',
        headers={'Authorization': auth_headers['Authorization']},
        data=data,
        content_type='multipart/form-data'
    )
    assert response.status_code == 400


# ========== TEST 15: Create Community Post ==========
def test_15_create_post(client, auth_headers):
    """TC-15: Create a community post."""
    response = client.post('/api/posts', headers=auth_headers, json={
        'content': 'Just completed my first guitar lesson! 🎸',
        'visibility': 'public'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'guitar' in data['post']['content'].lower()


# ========== TEST 15B: Create Skill-Tagged Post ==========
def test_15b_create_skill_tagged_post(client, auth_headers):
    """TC-15B: Posts linked to a skill should serialize correctly."""
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Bugfix Test Skill',
        'category': 'Photography',
        'description': 'Regression test skill'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    response = client.post('/api/posts', headers=auth_headers, json={
        'content': 'Completed a portrait lighting milestone.',
        'skill_id': skill_id,
        'visibility': 'public'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['post']['skill_id'] == skill_id
    assert data['post']['skill_name'] == 'Bugfix Test Skill'


# ========== TEST 16: Retrieve Feed ==========
def test_16_retrieve_feed(client, auth_headers):
    """TC-16: Retrieve community feed."""
    # Create a post first
    client.post('/api/posts', headers=auth_headers, json={
        'content': 'Test post for feed', 'visibility': 'public'
    })

    response = client.get('/api/feed', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['total'] >= 1


# ========== TEST 17: Like Post ==========
def test_17_like_post(client, auth_headers, second_user_headers):
    """TC-17: Like a post."""
    post_resp = client.post('/api/posts', headers=auth_headers, json={
        'content': 'Likeable post', 'visibility': 'public'
    })
    post_id = json.loads(post_resp.data)['post']['id']

    response = client.post(f'/api/posts/{post_id}/like', headers=second_user_headers)
    assert response.status_code == 200
    assert json.loads(response.data)['likes_count'] == 1


# ========== TEST 18: Duplicate Like Prevention ==========
def test_18_duplicate_like(client, auth_headers, second_user_headers):
    """TC-18: Duplicate like should fail."""
    post_resp = client.post('/api/posts', headers=auth_headers, json={
        'content': 'No double likes', 'visibility': 'public'
    })
    post_id = json.loads(post_resp.data)['post']['id']

    client.post(f'/api/posts/{post_id}/like', headers=second_user_headers)
    response = client.post(f'/api/posts/{post_id}/like', headers=second_user_headers)
    assert response.status_code == 409


# ========== TEST 19: Unlike Post ==========
def test_19_unlike_post(client, auth_headers, second_user_headers):
    """TC-19: Unlike a previously liked post."""
    post_resp = client.post('/api/posts', headers=auth_headers, json={
        'content': 'Unlike test', 'visibility': 'public'
    })
    post_id = json.loads(post_resp.data)['post']['id']

    client.post(f'/api/posts/{post_id}/like', headers=second_user_headers)
    response = client.delete(f'/api/posts/{post_id}/like', headers=second_user_headers)
    assert response.status_code == 200
    assert json.loads(response.data)['likes_count'] == 0


# ========== TEST 20: Add Comment ==========
def test_20_add_comment(client, auth_headers, second_user_headers):
    """TC-20: Add a comment to a post."""
    post_resp = client.post('/api/posts', headers=auth_headers, json={
        'content': 'Comment on this', 'visibility': 'public'
    })
    post_id = json.loads(post_resp.data)['post']['id']

    response = client.post(f'/api/posts/{post_id}/comments', headers=second_user_headers, json={
        'content': 'Great post! Keep going!'
    })
    assert response.status_code == 201


# ========== TEST 21: Unauthorized Content Deletion ==========
def test_21_unauthorized_deletion(client, auth_headers, second_user_headers):
    """TC-21: Cannot delete another user's post."""
    post_resp = client.post('/api/posts', headers=auth_headers, json={
        'content': 'My private post', 'visibility': 'public'
    })
    post_id = json.loads(post_resp.data)['post']['id']

    response = client.delete(f'/api/posts/{post_id}', headers=second_user_headers)
    assert response.status_code == 403


# ========== TEST 22: Analytics Calculation ==========
def test_22_analytics(client, auth_headers):
    """TC-22: Dashboard analytics should return valid data."""
    # Create skill and log practice
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Analytics Test', 'category': 'Coding'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    client.post('/api/practice', headers=auth_headers, json={
        'skill_id': skill_id, 'duration_minutes': 120
    })

    response = client.get('/api/analytics/dashboard', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['overview']['total_practice_minutes'] == 120
    assert data['overview']['total_sessions'] == 1


# ========== TEST 23: User Data Isolation ==========
def test_23_data_isolation(client, auth_headers, second_user_headers):
    """TC-23: Users cannot access each other's private skills."""
    # User 1 creates skill
    skill_resp = client.post('/api/skills', headers=auth_headers, json={
        'skill_name': 'Private Skill', 'category': 'Coding'
    })
    skill_id = json.loads(skill_resp.data)['skill']['id']

    # User 2 tries to access it
    response = client.get(f'/api/skills/{skill_id}', headers=second_user_headers)
    assert response.status_code == 403


# ========== TEST 24: Health Check ==========
def test_24_health_check(client):
    """TC-24: Health endpoint should respond."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert json.loads(response.data)['status'] == 'healthy'


# ========== TEST 25: Missing Auth Token ==========
def test_25_missing_token(client):
    """TC-25: Protected endpoints require auth token."""
    response = client.get('/api/skills')
    assert response.status_code == 401


# ========== TEST 26: Get Current User ==========
def test_26_get_current_user(client, auth_headers):
    """TC-26: Get authenticated user info."""
    response = client.get('/api/me', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['email'] == 'test@example.com'


# ========== TEST 27: Logout ==========
def test_27_logout(client, auth_headers):
    """TC-27: Logout endpoint responds correctly."""
    response = client.post('/api/logout', headers=auth_headers)
    assert response.status_code == 200
