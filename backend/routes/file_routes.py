# ===================================================
# routes/file_routes.py — File Upload REST API
# ===================================================
# POST   /api/files/upload   — Upload a file
# DELETE /api/files/<id>     — Delete an uploaded file
# ===================================================
# Simulates cloud object storage locally using the
# filesystem. In production, replace with S3/GCS/Azure
# Blob Storage SDK calls.
# ===================================================

import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, FileUpload

file_bp = Blueprint('files', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16 MB


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_type(filename):
    """Determine file type from extension."""
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
        return 'image'
    elif ext in {'pdf', 'doc', 'docx'}:
        return 'document'
    return 'other'


@file_bp.route('/api/files/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """
    Upload a file to cloud storage (local simulation).
    Request: multipart/form-data with 'file' field and optional 'purpose' field
    Response: { message, file }
    Status: 201 Created, 400 Bad Request
    """
    user_id = int(get_jwt_identity())

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({
            'error': f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size exceeds 16 MB limit'}), 400

    # Generate unique filename
    original_filename = secure_filename(file.filename)
    ext = original_filename.rsplit('.', 1)[1].lower()
    stored_filename = f"{uuid.uuid4().hex}.{ext}"

    # Create user directory structure (simulates cloud storage paths)
    purpose = request.form.get('purpose', 'general')
    user_dir = os.path.join(
        current_app.config['UPLOAD_FOLDER'],
        f'user_{user_id}',
        purpose
    )
    os.makedirs(user_dir, exist_ok=True)

    # Save file
    file_path = os.path.join(user_dir, stored_filename)
    file.save(file_path)

    # Store metadata in database
    file_record = FileUpload(
        user_id=user_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_type=get_file_type(original_filename),
        file_size=file_size,
        purpose=purpose
    )

    db.session.add(file_record)
    db.session.commit()

    # Generate URL (in production, this would be a cloud storage URL or signed URL)
    file_url = f'/api/files/serve/{file_record.id}'

    return jsonify({
        'message': 'File uploaded successfully',
        'file': file_record.to_dict(),
        'url': file_url
    }), 201


@file_bp.route('/api/files/serve/<int:file_id>', methods=['GET'])
def serve_file(file_id):
    """
    Serve an uploaded file.
    In production, this would redirect to a cloud storage signed URL.
    """
    file_record = db.session.get(FileUpload, file_id)

    if not file_record:
        return jsonify({'error': 'File not found'}), 404

    directory = os.path.dirname(file_record.file_path)
    filename = os.path.basename(file_record.file_path)

    return send_from_directory(directory, filename)


@file_bp.route('/api/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """
    Delete an uploaded file.
    Response: { message }
    Status: 200 OK, 403 Forbidden, 404 Not Found
    """
    user_id = int(get_jwt_identity())
    file_record = db.session.get(FileUpload, file_id)

    if not file_record:
        return jsonify({'error': 'File not found'}), 404

    if file_record.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    # Delete physical file
    try:
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)
    except OSError:
        pass  # File may already be deleted

    # Delete database record
    db.session.delete(file_record)
    db.session.commit()

    return jsonify({'message': 'File deleted successfully'}), 200
