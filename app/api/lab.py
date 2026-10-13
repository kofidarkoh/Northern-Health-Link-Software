import os
import uuid
import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import lab_bp
from app.models.lab import LabRequest, LabResult
from app.models.user import User
from app.middleware.auth import require_roles
from app.services.audit_service import record_audit
from app.services.notification_service import create_notification
from app.extensions import limiter

logger = logging.getLogger(__name__)

MAX_FILE_BYTES = 10 * 1024 * 1024


@lab_bp.route('/results/upload', methods=['POST'])
@jwt_required()
@require_roles('LAB_OFFICER', 'ADMIN')
@limiter.limit("20 per minute")
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

    file.seek(0, os.SEEK_END)
    if file.tell() > MAX_FILE_BYTES:
        return jsonify({'error': 'File too large (max 10MB)'}), 400
    file.seek(0)

    lab_request_id = request.form.get('lab_request_id') or ''
    result_summary = (request.form.get('result_summary') or '').strip()
    if not lab_request_id.isdigit():
        return jsonify({'error': 'Valid lab_request_id is required'}), 400
    if not result_summary:
        return jsonify({'error': 'result_summary is required'}), 400

    identity = get_jwt_identity()
    user = User.get_or_none(User.id == int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    lab_request = LabRequest.get_or_none(
        (LabRequest.id == int(lab_request_id)) & (LabRequest.is_deleted == False)  # noqa: E712
    )
    if not lab_request:
        return jsonify({'error': 'Lab request not found'}), 404

    existing = LabResult.get_or_none(
        (LabResult.lab_request_id == lab_request.id) & (LabResult.is_deleted == False)  # noqa: E712
    )
    if existing:
        return jsonify({'error': 'Result already uploaded for this request',
                        'lab_result_id': existing.id}), 409

    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        'uploads', 'lab_results'
    )
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    try:
        lab_result = LabResult.create(
            lab_request_id=lab_request.id,
            result_summary=result_summary,
            file_url=f"uploads/lab_results/{filename}",
            uploaded_by=user
        )
        lab_request.status = 'RESULT_UPLOADED'
        lab_request.save()
        record_audit(int(identity), 'LAB_RESULT_UPLOADED', 'lab_results', lab_result.id)
        create_notification(
            lab_request.requested_by_id,
            'Lab Results Available',
            f'Lab results for {lab_request.test_type} are now available',
            lab_request.patient_id
        )
    except Exception as e:
        logger.error("Failed to save lab result upload: %s", e)
        try:
            os.remove(filepath)
        except OSError:
            pass
        return jsonify({'error': 'Failed to save lab result'}), 500

    return jsonify({'message': 'File uploaded',
                    'lab_result': lab_result.to_dict()}), 201
