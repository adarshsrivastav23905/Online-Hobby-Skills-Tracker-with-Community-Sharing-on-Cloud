# ===================================================
# app.py — Main Flask Application Entry Point
# ===================================================
# Cloud Hobby & Skills Tracker Backend
# Demonstrates: REST API, Authentication, Authorization,
# Cloud Database, Cloud Object Storage, Analytics
# ===================================================

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_app(test_config=None):
    """Application factory pattern for Flask."""
    app = Flask(__name__)

    # === Configuration ===
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///hobby_tracker.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

    if test_config:
        app.config.update(test_config)

    # Upload folder configuration (simulates cloud object storage)
    upload_folder = os.getenv('UPLOAD_FOLDER', 'uploads')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), upload_folder)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # === Extensions ===
    # CORS — allows frontend to communicate with backend
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    CORS(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:5173"]}})

    # JWT Authentication
    JWTManager(app)

    # Database
    from models import db
    db.init_app(app)

    # Create tables
    with app.app_context():
        db.create_all()

    # === Register Blueprints (Route Modules) ===
    from routes.auth_routes import auth_bp
    from routes.profile_routes import profile_bp
    from routes.skill_routes import skill_bp
    from routes.practice_routes import practice_bp
    from routes.goal_routes import goal_bp
    from routes.post_routes import post_bp
    from routes.file_routes import file_bp
    from routes.analytics_routes import analytics_bp
    from routes.follow_routes import follow_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(skill_bp)
    app.register_blueprint(practice_bp)
    app.register_blueprint(goal_bp)
    app.register_blueprint(post_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(follow_bp)

    # === Health Check Endpoint ===
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'service': 'Hobby & Skills Tracker API'}, 200

    # === Error Handlers ===
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500

    @app.errorhandler(413)
    def file_too_large(e):
        return {'error': 'File too large. Maximum size is 16 MB'}, 413

    return app


# === Run the Application ===
if __name__ == '__main__':
    app = create_app()
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    print(f"""
    ====================================================
       Cloud Hobby & Skills Tracker -- Backend API      
       Running on http://{host}:{port}                    
       Database: SQLite (local simulation)              
       Storage: Local filesystem (cloud simulation)     
    ====================================================
    """)

    app.run(host=host, port=port, debug=debug)
