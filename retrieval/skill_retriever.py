from skills.skill_store import load_skills

def format_skills_for_prompt(skills: list) -> str:
    """
    Formats a list of skills into a structured text block for LLM prompts.
    """
    if not skills:
        return ""
    
    skills_text = "\n".join([f"- {s.get('trigger', 'Skill')}: {s.get('instructions', '')}" for s in skills])
    
    return f"\n\n### ACTIVE SKILLS (Context-Aware Behavior)\n{skills_text}\n"

def get_skills_context(skills: list = None) -> str:
    """
    Retrieves and formats the context string.
    If skills are not provided, it fetches them from storage.
    """
    if skills is None:
        skills = load_skills()
    return format_skills_for_prompt(skills)
