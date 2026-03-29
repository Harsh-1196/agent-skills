"""
Semantic Skill Retriever — replaces the old "dump all skills" approach.

Two retrieval strategies:
  1. Vector search (MongoDB active_skills via embedding cosine similarity)
  2. Local semantic matching (data/skills.json using TF-IDF + cosine similarity)

Both produce scored results. The final context only includes skills that clear
a relevance threshold, so the LLM prompt stays lean and focused.
"""

import math
import re
from collections import Counter
from skills.skill_store import load_skills

# ── Tunables ──────────────────────────────────────────────────────────────────
MIN_RELEVANCE_SCORE = 0.15   # Minimum TF-IDF cosine similarity to include a skill
MAX_SKILLS_IN_PROMPT = 3     # Cap on skills injected into the LLM prompt
# ─────────────────────────────────────────────────────────────────────────────


# ═══════════════════════════════════════════════════════════════════════════════
# LOCAL SEMANTIC MATCHING (TF-IDF + Cosine Similarity)
# ═══════════════════════════════════════════════════════════════════════════════

_STOP_WORDS = frozenset({
    "a", "an", "the", "is", "it", "of", "in", "to", "and", "or", "for",
    "on", "with", "as", "at", "by", "this", "that", "from", "be", "are",
    "was", "were", "been", "has", "have", "had", "do", "does", "did",
    "will", "would", "can", "could", "should", "may", "might", "i", "me",
    "my", "we", "you", "your", "he", "she", "they", "them", "its", "not",
    "no", "but", "if", "so", "how", "what", "when", "where", "which",
    "who", "why", "about", "into", "more", "some", "than", "then", "very",
    "just", "also", "each", "any", "all", "only", "such", "like", "other",
})


def _tokenize(text: str) -> list[str]:
    """Lowercase, strip non-alphanumeric, remove stop-words."""
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if t not in _STOP_WORDS and len(t) > 1]


def _build_skill_document(skill: dict) -> str:
    """Concatenate all semantically relevant fields for a skill into one document."""
    parts = [
        skill.get("name", "").replace("-", " "),
        skill.get("description", ""),
        skill.get("trigger", ""),
        " ".join(skill.get("triggers", [])),
        skill.get("instructions", ""),
        skill.get("prompt_template", ""),
    ]
    # Also include example inputs for broader coverage
    for ex in skill.get("examples", []):
        if isinstance(ex, dict):
            parts.append(ex.get("input", ""))
            parts.append(ex.get("expected_behavior", ""))
    return " ".join(parts)


def _term_freq(tokens: list[str]) -> dict[str, float]:
    """Augmented term-frequency (prevents bias toward longer docs)."""
    counts = Counter(tokens)
    if not counts:
        return {}
    max_count = max(counts.values())
    return {t: 0.5 + 0.5 * (c / max_count) for t, c in counts.items()}


def _idf(doc_token_sets: list[set[str]], vocab: set[str]) -> dict[str, float]:
    """Inverse document frequency across all skill documents + query."""
    n = len(doc_token_sets)
    idf_map = {}
    for term in vocab:
        df = sum(1 for d in doc_token_sets if term in d)
        idf_map[term] = math.log((n + 1) / (df + 1)) + 1  # smoothed IDF
    return idf_map


def _cosine_sim(v1: dict[str, float], v2: dict[str, float]) -> float:
    """Cosine similarity between two sparse TF-IDF vectors."""
    shared = set(v1) & set(v2)
    if not shared:
        return 0.0
    dot = sum(v1[k] * v2[k] for k in shared)
    mag1 = math.sqrt(sum(x * x for x in v1.values()))
    mag2 = math.sqrt(sum(x * x for x in v2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


def _compute_tfidf_vector(tf: dict[str, float], idf_map: dict[str, float]) -> dict[str, float]:
    return {t: tf_val * idf_map.get(t, 0) for t, tf_val in tf.items()}


def match_skills_locally(query: str, skills: list[dict] | None = None) -> list[dict]:
    """
    Rank skills against the query using TF-IDF cosine similarity.
    Returns skills sorted by score (descending), filtered by MIN_RELEVANCE_SCORE.
    """
    if skills is None:
        skills = load_skills()
    if not skills or not query.strip():
        return []

    # Tokenize query
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    # Build documents for each skill
    skill_docs = [_build_skill_document(s) for s in skills]
    skill_token_lists = [_tokenize(doc) for doc in skill_docs]

    # Build vocab and IDF
    all_token_sets = [set(query_tokens)] + [set(t) for t in skill_token_lists]
    vocab = set()
    for ts in all_token_sets:
        vocab.update(ts)
    idf_map = _idf(all_token_sets, vocab)

    # Query TF-IDF vector
    query_tf = _term_freq(query_tokens)
    query_vec = _compute_tfidf_vector(query_tf, idf_map)

    # Score each skill
    scored = []
    for idx, tokens in enumerate(skill_token_lists):
        tf = _term_freq(tokens)
        vec = _compute_tfidf_vector(tf, idf_map)
        score = _cosine_sim(query_vec, vec)
        if score >= MIN_RELEVANCE_SCORE:
            scored.append({**skills[idx], "_match_score": round(score, 4)})

    scored.sort(key=lambda x: x["_match_score"], reverse=True)
    return scored[:MAX_SKILLS_IN_PROMPT]


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT FORMATTING
# ═══════════════════════════════════════════════════════════════════════════════

def format_skills_for_prompt(skills: list) -> str:
    """
    Formats a list of scored/matched skills into a structured text block for LLM prompts.
    Only includes skills above the relevance threshold.
    """
    if not skills:
        return ""

    lines = []
    for s in skills:
        name = s.get("trigger", s.get("name", "Skill"))
        instructions = s.get("instructions", s.get("prompt_template", ""))
        score = s.get("_match_score", s.get("score", ""))
        score_str = f" [relevance: {score}]" if score else ""
        lines.append(f"- {name}{score_str}: {instructions}")

    skills_text = "\n".join(lines)
    return f"\n\n### ACTIVE SKILLS (Context-Aware Behavior)\n{skills_text}\n"


def get_skills_context(query: str = "", skills: list = None) -> str:
    """
    Retrieves and formats the context string.
    If a query is provided, performs semantic matching to pick the best skills.
    If skills are already provided (e.g. from vector search), formats those.
    """
    if skills:
        # Already matched/provided — just format
        return format_skills_for_prompt(skills)

    if query:
        matched = match_skills_locally(query)
        if matched:
            return format_skills_for_prompt(matched)

    return ""
