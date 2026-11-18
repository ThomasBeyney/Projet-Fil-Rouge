import pytest
from pydantic import ValidationError
from app.schemas import EquipmentData, IncidentData, UserData
from app.monitor import safe_target


def test_private_ips_only():
    assert safe_target('192.168.1.12') == '192.168.1.12'
    assert safe_target('127.0.0.1') == '127.0.0.1'
    for host in ('8.8.8.8', 'example.com', '169.254.1.1', '0.0.0.0'):
        with pytest.raises(ValueError):
            safe_target(host)


def test_equipment_validation():
    with pytest.raises(ValidationError):
        EquipmentData(name='  ', type='Serveur', site='Paris')


def test_incident_validation():
    with pytest.raises(ValidationError):
        IncidentData(title='Test', severity='invalid', status='open', equipmentId=1)


def test_user_email_validation():
    with pytest.raises(ValidationError):
        UserData(name='Test', email='invalid', role='viewer')
