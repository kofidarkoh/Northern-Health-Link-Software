import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.api import deliveries_bp
from app.models.delivery import Delivery
from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.notification_service import create_notification
from app.middleware.auth import require_roles, get_current_user_clinic_id
from app.extensions import limiter, socketio
from app.schemas.validators import DeliveryCreateSchema, DeliveryStatusSchema

logger = logging.getLogger(__name__)

delivery_create_schema = DeliveryCreateSchema()
delivery_status_schema = DeliveryStatusSchema()


@deliveries_bp.route('/', methods=['POST'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'ADMIN')
@limiter.limit("30 per minute")
def create_delivery():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = delivery_create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        delivery = Delivery.create(
            prescription_id=validated['prescription_id'],
            rider_id=validated.get('rider_id'),
            requested_by=get_jwt_identity(),
            delivery_address=validated['delivery_address'],
            status='PENDING'
        )

        identity = get_jwt_identity()
        record_audit(int(identity), 'DELIVERY_REQUESTED', 'deliveries', delivery.id)

        if validated.get('rider_id'):
            create_notification(
                validated['rider_id'],
                'New Delivery Assignment',
                f'You have a new delivery assignment',
                Prescription.get_or_none(Prescription.id == validated['prescription_id']).patient_id if Prescription.get_or_none(Prescription.id == validated['prescription_id']) else None
            )
    except Exception as e:
        logger.error("Failed to create delivery: %s", e)
        return jsonify({'error': 'Failed to create delivery'}), 500

    return jsonify({
        'message': 'Delivery request created',
        'delivery': delivery.to_dict()
    }), 201


@deliveries_bp.route('/<int:delivery_id>/status', methods=['PATCH'])
@jwt_required()
@require_roles('RIDER', 'ADMIN')
@limiter.limit("30 per minute")
def update_delivery_status(delivery_id):
    delivery = Delivery.get_or_none(Delivery.id == delivery_id)
    if not delivery:
        return jsonify({'error': 'Delivery not found'}), 404

    identity = int(get_jwt_identity())
    user_role = get_jwt().get('role', '')

    if user_role != 'ADMIN' and delivery.rider_id != identity:
        return jsonify({'error': 'Access denied: delivery not assigned to you'}), 403

    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400

    try:
        validated = delivery_status_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        delivery.status = validated['status']
        delivery.status_note = validated.get('status_note')
        delivery.save()

        record_audit(identity, 'DELIVERY_STATUS_UPDATED', 'deliveries', delivery_id, {'status': validated['status']})

        try:
            socketio.emit('delivery_status_update', {
                'delivery_id': delivery_id,
                'status': validated['status'],
                'status_note': validated.get('status_note')
            }, room=f'delivery_{delivery_id}')
        except Exception as e:
            logger.warning("SocketIO emit failed for delivery %s: %s", delivery_id, e)

        create_notification(
            delivery.requested_by_id,
            'Delivery Status Updated',
            f'Delivery status changed to {validated["status"]}',
            delivery.prescription.patient_id if delivery.prescription else None
        )
    except Exception as e:
        logger.error("Failed to update delivery %s status: %s", delivery_id, e)
        return jsonify({'error': 'Failed to update delivery status'}), 500

    return jsonify({
        'message': 'Delivery status updated',
        'delivery': delivery.to_dict()
    }), 200


@deliveries_bp.route('/', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'RIDER', 'ADMIN')
@limiter.limit("60 per minute")
def list_deliveries():
    status = request.args.get('status')
    rider_id = request.args.get('rider_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = Delivery.select().where(Delivery.is_deleted == False)

    user_role = get_jwt().get('role', '')
    identity = int(get_jwt_identity())
    clinic_id = get_current_user_clinic_id()

    if user_role == 'RIDER':
        query = query.where(Delivery.rider_id == identity)
    elif user_role != 'ADMIN' and clinic_id:
        query = query.where(Delivery.prescription_id <<
            Prescription.select(Prescription.id).where(
                Prescription.patient_id <<
                Patient.select(Patient.id).where(Patient.clinic_id == clinic_id)
            ))

    if status:
        query = query.where(Delivery.status == status)
    if rider_id and user_role == 'ADMIN':
        query = query.where(Delivery.rider_id == rider_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    deliveries = query.order_by(Delivery.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'deliveries': [d.to_dict() for d in deliveries],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@deliveries_bp.route('/<int:delivery_id>', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'RIDER', 'ADMIN')
@limiter.limit("60 per minute")
def get_delivery(delivery_id):
    delivery = Delivery.get_or_none(Delivery.id == delivery_id)
    if not delivery:
        return jsonify({'error': 'Delivery not found'}), 404

    user_role = get_jwt().get('role', '')
    identity = int(get_jwt_identity())
    clinic_id = get_current_user_clinic_id()

    if user_role == 'RIDER':
        if delivery.rider_id != identity:
            return jsonify({'error': 'Access denied: delivery not assigned to you'}), 403
    elif user_role != 'ADMIN' and clinic_id:
        prescription = Prescription.get_or_none(Prescription.id == delivery.prescription_id)
        if prescription:
            patient = Patient.get_or_none(Patient.id == prescription.patient_id)
            if not patient or patient.clinic_id != clinic_id:
                return jsonify({'error': 'Access denied: delivery belongs to another clinic'}), 403

    return jsonify({
        'delivery': delivery.to_dict()
    }), 200
