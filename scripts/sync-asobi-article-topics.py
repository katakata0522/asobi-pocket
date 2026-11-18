"""記事の本文を正本として、ゲームで使うお題データを生成する。"""

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "my-webservice/asobi-pocket"
ARTICLES = {
    "ito": ("ito-odai", "div", "seo-topic"),
    "word-wolf": ("wordwolf-odai", "div", "seo-pair"),
    "asa-sore": ("asa-sore-odai", "div", "seo-topic"),
    "sea-turtle": ("sea-turtle-quiz", "article", "quiz-card"),
}


class InlineText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain_text(markup):
    parser = InlineText()
    parser.feed(markup)
    parser.close()
    return " ".join("".join(parser.parts).split())


def read_text(markup, pattern):
    match = re.search(pattern, markup, flags=re.S)
    if match is None:
        raise ValueError(f"本文の要素が見つかりません: {pattern}")
    return plain_text(match[1])


def read_title(card, game, number):
    links = re.findall(r'<a class="article-topic-link" href="([^"]+)">(.*?)</a>', card, flags=re.S)
    expected_href = f"../#game/{game}?topic={number}"
    if len(links) != 1 or links[0][0] != expected_href:
        raise ValueError(f"お題のリンクを確認してください: {expected_href}")
    title = plain_text(links[0][1])
    prefix = f"{number}. "
    if not title.startswith(prefix) or title == prefix.rstrip():
        raise ValueError(f"お題番号または名前が正しくありません: {title}")
    return title.removeprefix(prefix)


def read_quiz(card, title):
    disclosures = re.findall(r"<details><summary>([^<]+)</summary><p>(.*?)</p>(.*?)</details>", card, flags=re.S)
    if [label for label, _, _ in disclosures] != ["ヒント1", "ヒント2", "ヒント3", "答え"]:
        raise ValueError(f"3つのヒントと答えが必要です: {title}")
    return {
        "title": title,
        "question": read_text(card, r'<p class="question">(.*?)</p>'),
        "hints": [plain_text(body) for _, body, _ in disclosures[:3]],
        "answer": plain_text(disclosures[3][1]),
        "hostNote": read_text(disclosures[3][2], r'<div class="host-note">(.*?)</div>'),
    }


def read_topic(game, card, title):
    if game == "sea-turtle":
        return read_quiz(card, title)
    if game == "word-wolf":
        words = [word.strip() for word in title.split(" / ")]
        if len(words) != 2 or not all(words) or words[0] == words[1]:
            raise ValueError(f"異なる2語を指定してください: {title}")
        return {"citizen": words[0], "wolf": words[1], "category": "記事のお題"}
    if game == "asa-sore":
        prefix = "「○」で始まる"
        if not title.startswith(prefix) or title == prefix:
            raise ValueError(f"頭文字の位置が見つかりません: {title}")
        return {"text": title.removeprefix(prefix)}
    scale = read_text(card, r"<small>(.*?)</small>")
    return {"text": f"{title}（{scale}）"}


def build_data():
    data = {}
    for game, (article, tag, css_class) in ARTICLES.items():
        source = (APP / "seo" / f"{article}.html").read_text(encoding="utf-8")
        cards = re.findall(rf'<{tag} class="{css_class}">(.*?)</{tag}>', source, flags=re.S)
        if not cards or len(cards) != source.count('class="article-topic-link"'):
            raise ValueError(f"お題カードとリンクの数が一致しません: {article}")
        data[game] = [
            read_topic(game, card, read_title(card, game, number))
            for number, card in enumerate(cards, 1)
        ]
    return data


def render_data(data):
    lines = [
        "// scripts/sync-asobi-article-topics.py が記事から生成します。",
        "const ASOBI_ARTICLE_TOPICS = {",
    ]
    for game, topics in data.items():
        lines.append(f"  {json.dumps(game)}: [")
        lines.extend("    " + json.dumps(topic, ensure_ascii=False) + "," for topic in topics)
        lines.append("  ],")
    lines.append("};")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="生成済みデータと記事の一致を検査する")
    args = parser.parse_args()
    target = APP / "data/article-topics.js"
    data = build_data()
    expected = render_data(data)
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != expected:
            raise SystemExit("記事からお題データを再生成してください: python3 scripts/sync-asobi-article-topics.py")
    else:
        target.write_text(expected, encoding="utf-8", newline="\n")
    print(f"記事とゲームのお題を照合: {sum(map(len, data.values()))}件")


if __name__ == "__main__":
    main()
