import logging
import functools
from flask import current_app, request
from flask_socketio import emit, join_room, leave_room, disconnect, ConnectionRefusedError
import jwt
import os
from app.models.patient import Patient
from app.models.delivery import Delivery

logger = logging.getLogger(__name__)

# Auth state per socket connection, keyed by sid. We deliberately do NOT use
# the flask session here: SocketIO is started with manage_session=False
# because Flask >= 3.1 exposes RequestContext.session as a read-only
# property, which crashes Flask-SocketIO's managed-session machinery.
_SID_AUTH = {}


def register_socket_events(socketio):

    @socketio.on('connect')
    def handle_connect(auth):
        if auth is None:
            raise ConnectionRefusedError('Authentication token required')

        token = auth.get('token')
        if not token:
            raise ConnectionRefusedError('Missing authentication token')

        try:
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')
            if not secret_key:
                logger.error("JWT_SECRET_KEY missing from app config and environment")
                raise ConnectionRefusedError('Server configuration error')

            payload = jwt.decode(
                token,
                secret_key,
                algorithms=['HS256']
            )

            user_id = payload.get('sub')
            role = payload.get('role')
            clinic_id = payload.get('clinic_id')

            _SID_AUTH[request.sid] = {
                'user_id': user_id,
                'role': role,
                'clinic_id': clinic_id,
                'authenticated': True,
            }

            join_room(f'user_{user_id}')
            join_room(f'role_{role}')

            emit('connection_established', {
                'status': 'authenticated',
                'user_id': user_id,
                'role': role,
                'message': 'Connected to Northern Health Link notification service'
            })

        except jwt.ExpiredSignatureError:
            raise ConnectionRefusedError('Token expired')
        except jwt.InvalidTokenError:
            raise ConnectionRefusedError('Invalid authentication token')

    @socketio.on('disconnect')
    def handle_disconnect(reason):
        auth = _SID_AUTH.pop(request.sid, None)
        if auth and auth.get('user_id'):
            leave_room(f'user_{auth["user_id"]}')
            if auth.get('role'):
                leave_room(f'role_{auth["role"]}')

    @socketio.on('join_patient_room')
    def handle_join_patient_room(data):
        auth = _SID_AUTH.get(request.sid) or {}
        if not auth.get('authenticated'):
            emit('error', {'message': 'Not authenticated'})
            return

        patient_id = data.get('patient_id')
        if not patient_id:
            emit('error', {'message': 'patient_id is required'})
            return

        user_role = auth.get('role', '')
        user_clinic_id = auth.get('clinic_id')
        user_id = auth.get('user_id')

        if user_role == 'ADMIN':
            pass
        elif user_role == 'LAB_OFFICER':
            pass
        else:
            patient = Patient.get_or_none(Patient.id == patient_id)
            if not patient:
                emit('error', {'message': 'Patient not found'})
                return
            if user_clinic_id and patient.clinic_id != user_clinic_id:
                emit('error', {'message': 'Access denied: patient belongs to another clinic'})
                return

        room_name = f'patient_{patient_id}'
        join_room(room_name)
        emit('room_joined', {
            'patient_id': patient_id,
            'room': room_name,
            'message': f'Receiving updates for patient {patient_id}'
        })

    @socketio.on('leave_patient_room')
    def handle_leave_patient_room(data):
        patient_id = data.get('patient_id')
        if patient_id:
            room_name = f'patient_{patient_id}'
            leave_room(room_name)
            emit('room_left', {'patient_id': patient_id})

    @socketio.on('join_delivery_room')
    def handle_join_delivery_room(data):
        auth = _SID_AUTH.get(request.sid) or {}
        if not auth.get('authenticated'):
            emit('error', {'message': 'Not authenticated'})
            return

        delivery_id = data.get('delivery_id')
        if not delivery_id:
            emit('error', {'message': 'delivery_id is required'})
            return

        user_role = auth.get('role', '')
        user_clinic_id = auth.get('clinic_id')
        user_id = auth.get('user_id')

        if user_role == 'ADMIN':
            pass
        else:
            delivery = Delivery.get_or_none(Delivery.id == delivery_id)
            if not delivery:
                emit('error', {'message': 'Delivery not found'})
                return
            if user_role == 'RIDER' and str(delivery.rider_id) != str(user_id):
                emit('error', {'message': 'Access denied: delivery not assigned to you'})
                return
            if user_role in ('CLINIC_STAFF', 'SPECIALIST'):
                prescription = delivery.prescription if hasattr(delivery, 'prescription') else None
                if prescription and user_clinic_id:
                    from app.models.prescription import Prescription
                    rx = Prescription.get_or_none(Prescription.id == delivery.prescription_id)
                    if rx:
                        from app.models.patient import Patient
                        patient = Patient.get_or_none(Patient.id == rx.patient_id)
                        if patient and patient.clinic_id != user_clinic_id:
                            emit('error', {'message': 'Access denied: delivery belongs to another clinic'})
                            return

        room_name = f'delivery_{delivery_id}'
        join_room(room_name)
        emit('room_joined', {
            'delivery_id': delivery_id,
            'room': room_name,
            'message': f'Receiving updates for delivery {delivery_id}'
        })

    @socketio.on('leave_delivery_room')
    def handle_leave_delivery_room(data):
        delivery_id = data.get('delivery_id')
        if delivery_id:
            room_name = f'delivery_{delivery_id}'
            leave_room(room_name)
            emit('room_left', {'delivery_id': delivery_id})
