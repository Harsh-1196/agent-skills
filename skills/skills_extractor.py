

from groq_llm import chat
from memory.interaction_logger import load_all_interactions
import json

# ── tunables ────────────────────────────────────────────────────────────────
MIN_INTERACTIONS   = 10   # skip extraction below this threshold
RECENT_WINDOW      = 10   # how many recent interactions to consider
MAX_QUERY_CHARS    = 300  # truncate long user queries
MAX_RESPONSE_CHARS = 400  # truncate long assistant responses (key saving)
# ────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a Skill Extraction system. Extract reusable, generalized AI skills from user interactions.

CORE IDEA
Each interaction has: PAYLOAD (specific topic) and CAPABILITY (reusable method).
Extract ONLY the CAPABILITY. Never tie a skill to a specific topic.
Bad: "Explain Dijkstra" | Good: "Explain algorithms with code"

WHEN TO EXTRACT
Extract ONLY when user provides reusable constraints/policies, consistent output formats, explicit corrections, multi-step workflows, or schema requirements.
Return [] for one-off generic tasks, assistant-only evidence, or skills that won't transfer to other topics.

MERGING (STRICT)
Only merge interactions into ONE skill if ALL match: same objective + same deliverable type + same operation class + same constraints.
Different on any dimension = separate skills.
NEVER put one skill's logic inside another skill's examples field.

EXTRACTION RULES
1. Generalize: replace specifics with placeholders like <ALGORITHM>, <TOPIC>, <LANGUAGE>
2. Focus on HOW (style, format, constraints) not WHAT (topic, content)
3. Constraints over content: extract the rule, discard the payload
4. De-identify: remove org/person/project names, URLs, dates, keys
5. No invention: only extract what user explicitly stated

PROMPT_TEMPLATE STRUCTURE (Markdown inside the string)
# Goal — objective + output contract, use placeholders
# Constraints & Style — must-do and must-not-do rules
# Workflow — OPTIONAL, only when user described explicit multi-stage AI operations

OUTPUT
Return ONLY valid JSON array, no markdown fences, no explanation.
[{"name":"","description":"","triggers":[],"prompt_template":"","input_variables":[],"examples":[],"confidence":0.0}]

FIELD RULES
- name: kebab-case, encodes intent+task+domain, no vague names
- description: 1-2 sentences, third person, what+when, no instance facts
- prompt_template: self-contained, uses <PLACEHOLDER> syntax
- examples: 2-4 items as {"input":"...","expected_behavior":"..."}, specific to THIS skill only
- triggers: 3-5 short intent phrases, no near-duplicates
- confidence: 0.0-1.0

BEFORE OUTPUT — verify each skill:
- Reusable across different topics? De-identified? Capability not subject in name?
- prompt_template self-contained? examples not borrowed from another skill?
- Would merging with another skill violate the merge rules? If yes, keep separate.

Return [] if no valid skill exists. Quality over quantity."""


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "…[truncated]"


def _build_interaction_block(interactions: list) -> str:
    lines = []
    for idx, i in enumerate(interactions, 1):
        query    = _truncate(i["query"].strip(),    MAX_QUERY_CHARS)
        response = _truncate(i["response"].strip(), MAX_RESPONSE_CHARS)
        lines.append(f"[{idx}] User: {query}\n    Assistant: {response}")
    return "\n\n".join(lines)


def extract_skills() -> list:
    interactions = load_all_interactions()

    if len(interactions) < MIN_INTERACTIONS:
        print(f"[skill_extractor] Only {len(interactions)} interactions — skipping.")
        return []

    recent = interactions[-RECENT_WINDOW:]
    interaction_block = _build_interaction_block(recent)

    user_message = f"Extract skills from these interactions:\n\n{interaction_block}"

    # single LLM call with system + user split
    result = chat(system=SYSTEM_PROMPT, message=user_message)

    try:
        skills = json.loads(result)
    except json.JSONDecodeError as e:
        # attempt to salvage if the model wrapped output in ```json ... ```
        cleaned = result.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            skills = json.loads(cleaned)
        except json.JSONDecodeError:
            print(f"[skill_extractor] JSON parse failed: {e}")
            skills = []

    print(f"[skill_extractor] Extracted {len(skills)} skill(s).")
    return skills