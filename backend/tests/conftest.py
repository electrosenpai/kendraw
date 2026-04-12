from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from kendraw_api.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as c:
        yield c
