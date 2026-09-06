from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ok'


def test_analyze_endpoint_accepts_dummy_upload():
    response = client.post(
        '/api/analyze-prescription',
        files={'image': ('prescription.jpg', b'dummy-image-bytes', 'image/jpeg')},
        data={'notes': 'Test upload'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'authenticity_score' in data
    assert 'medicines' in data
    assert 'history_entry' in data


