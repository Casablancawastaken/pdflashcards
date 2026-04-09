from back.services.ai_prompt import build_cards_prompt


def test_build_cards_prompt_contains_json_instruction():
    prompt = build_cards_prompt("Пример текста", max_cards=5)

    assert "JSON" in prompt
    assert '"cards"' in prompt
    assert "Пример текста" in prompt
    assert "5" in prompt


def test_build_cards_prompt_truncates_long_text():
    long_text = "a" * 2000
    prompt = build_cards_prompt(long_text)

    assert len(prompt) < 3000