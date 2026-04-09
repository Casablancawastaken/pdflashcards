from back.services.books_api import _normalize_item


def test_normalize_item_returns_expected_structure():
    item = {
        "id": "book1",
        "volumeInfo": {
            "title": "Python Basics",
            "authors": ["Author 1"],
            "description": "A" * 400,
            "imageLinks": {
                "thumbnail": "http://example.com/thumb.jpg"
            },
            "infoLink": "http://example.com",
            "publishedDate": "2024",
        },
    }

    result = _normalize_item(item)

    assert result["id"] == "book1"
    assert result["title"] == "Python Basics"
    assert result["authors"] == ["Author 1"]
    assert len(result["description"]) == 300
    assert result["thumbnail"] == "http://example.com/thumb.jpg"
    assert result["info_url"] == "http://example.com"
    assert result["published_date"] == "2024"


def test_normalize_item_handles_missing_fields():
    result = _normalize_item({})

    assert result["id"] is None
    assert result["title"] == "Без названия"
    assert result["authors"] == []
    assert result["description"] == ""
    assert result["thumbnail"] is None
    assert result["info_url"] is None
    assert result["published_date"] is None