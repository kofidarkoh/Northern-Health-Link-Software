import os
import uuid
import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import lab_bp
from app.models.lab import LabRequest, LabResult
from app.models.user import User
from app.middleware.auth import require_roles

logger = logging.getLogger(__name__)


@lab_bp.route('/results/upload', methods=['POST'])
@jwt_required()
@require_roles('LAB_OFFICER', 'ADMIN')
def upload_lab_result():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    allowed = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        return jsonify({'error': f'File type {ext} not allowed'}), 400

    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        'uploads', 'lab_results'
    )
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    lab_request_id = request.form.get('lab_request_id')
    result_summary = request.form.get('result_summary', '')

    user = User.get_or_none(User.user_id == get_jwt_identity())

    lab_result = LabResult.create(
        lab_request=lab_request_id,
        result_summary=result_summary,
        file_url=f"uploads/lab_results/{filename}",
        uploaded_by=user
    )

    return jsonify({'message': 'File uploaded', 'lab_result_id': str(lab_result.id)}), 201
