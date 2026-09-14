"""Personalized recommendation engine.

Uses quiz scores, challenge performance, repeated mistakes, and incomplete
modules to suggest the next best learning activity for each learner.
All recommendations are explainable.
"""
from typing import List, Dict, Any

MODULE_ORDER = [
    "math-foundations", "quantum-foundations", "quantum-circuits",
    "quantum-information", "core-algorithms", "advanced-algorithms",
    "quantum-complexity", "error-correction", "quantum-hardware",
    "quantum-programming", "quantum-ml", "quantum-applications", "research-future",
]


class RecommendationEngine:

    def generate(self, progress_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate up to 5 prioritised recommendations."""
        recs: List[Dict[str, Any]] = []

        completed = set(progress_data.get("completed_lessons", []))
        quiz_scores: Dict[str, Dict] = progress_data.get("quiz_scores", {})
        challenge_scores: Dict[str, Dict] = progress_data.get("challenge_scores", {})
        mistakes: List[Dict] = progress_data.get("mistakes", [])
        all_lessons: List[Dict] = progress_data.get("all_lessons", [])

        # 1. Highest-priority: lessons with low quiz scores (< 60%)
        for lesson_id, score_data in quiz_scores.items():
            score = score_data.get("score", 0)
            total = score_data.get("total", 1)
            pct = score / total if total else 0
            if pct < 0.6:
                lesson = next((l for l in all_lessons if l["id"] == lesson_id), None)
                title = lesson["title"] if lesson else lesson_id
                recs.append({
                    "type": "review",
                    "title": f"Review: {title}",
                    "description": f"Your quiz score was {score}/{total} ({pct*100:.0f}%). Review this lesson to strengthen understanding.",
                    "target_id": lesson_id,
                    "priority": "high",
                    "reason": f"Quiz score {pct*100:.0f}% is below the 60% threshold.",
                })

        # 2. Modules with repeated mistakes
        mistake_counts: Dict[str, int] = {}
        for m in mistakes:
            module_id = m.get("module_id", "")
            if module_id:
                mistake_counts[module_id] = mistake_counts.get(module_id, 0) + 1

        for module_id, count in mistake_counts.items():
            if count >= 3:
                recs.append({
                    "type": "practice",
                    "title": f"Practice more: {module_id.replace('-', ' ').title()}",
                    "description": f"You have made {count} mistakes in this module. Practice with circuit challenges to improve.",
                    "target_id": module_id,
                    "priority": "high",
                    "reason": f"{count} mistakes detected in this module.",
                })

        # 3. Next uncompleted lesson in curriculum order
        for lesson in all_lessons:
            if lesson["id"] not in completed:
                module_id = lesson.get("module_id", "")
                recs.append({
                    "type": "lesson",
                    "title": f"Continue: {lesson['title']}",
                    "description": f"Pick up your learning in {module_id.replace('-', ' ').title()}. ~{lesson.get('duration', 20)} min.",
                    "target_id": lesson["id"],
                    "priority": "high" if not completed else "medium",
                    "reason": "Next uncompleted lesson in your curriculum.",
                })
                break

        # 4. Challenge suggestion if few challenges attempted
        if len(challenge_scores) < 3 and completed:
            recs.append({
                "type": "challenge",
                "title": "Try a Circuit Challenge",
                "description": "You have completed lessons — put your knowledge to the test with a hands-on circuit challenge.",
                "target_id": "challenges",
                "priority": "medium",
                "reason": "Fewer than 3 challenges completed.",
            })

        # 5. Advanced content for high performers
        if quiz_scores:
            avg_pct = sum(
                s.get("score", 0) / max(s.get("total", 1), 1)
                for s in quiz_scores.values()
            ) / len(quiz_scores)
            if avg_pct > 0.85:
                advanced = next(
                    (l for l in all_lessons if l.get("difficulty") == "Advanced" and l["id"] not in completed),
                    None,
                )
                if advanced:
                    recs.append({
                        "type": "lesson",
                        "title": f"Ready for Advanced: {advanced['title']}",
                        "description": f"Your quiz average is {avg_pct*100:.0f}% — you are ready for advanced content.",
                        "target_id": advanced["id"],
                        "priority": "low",
                        "reason": f"High quiz performance ({avg_pct*100:.0f}% average).",
                    })

        # Sort by priority and deduplicate by target_id
        order = {"high": 0, "medium": 1, "low": 2}
        seen = set()
        unique_recs = []
        for rec in sorted(recs, key=lambda r: order.get(r["priority"], 1)):
            key = (rec["type"], rec["target_id"])
            if key not in seen:
                seen.add(key)
                unique_recs.append(rec)

        return unique_recs[:5]
