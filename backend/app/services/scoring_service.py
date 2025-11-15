"""
Scoring service for component evaluation and ranking calculations.

Handles weighted score calculations and result generation.
"""

from typing import List, Dict, Any, Tuple


class ScoringService:
    """Service for scoring calculations and result generation."""
    
    @staticmethod
    def calculate_weighted_scores(
        components: List[Any],
        criteria: List[Any],
        scores_dict: Dict[Tuple[str, str], Any]
    ) -> List[Dict[str, Any]]:
        """
        Calculate weighted scores for all components.
        
        Args:
            components: List of component objects
            criteria: List of criterion objects
            scores_dict: Dict mapping (component_id, criterion_id) to score object
            
        Returns:
            List of result dictionaries with component, scores, and total_score
        """
        total_weight = sum(c.weight for c in criteria) if criteria else 1
        
        results = []
        for component in components:
            component_scores = []
            score_dict = {}
            
            for criterion in criteria:
                key = (str(component.id), str(criterion.id))
                if key in scores_dict:
                    score = scores_dict[key]
                    component_scores.append(score)
                    score_dict[criterion.id] = score
            
            # Calculate weighted total
            weighted_sum = sum(
                score_dict[criterion.id].score * criterion.weight
                for criterion in criteria
                if criterion.id in score_dict
            )
            
            total_score = weighted_sum / total_weight if total_weight > 0 else 0
            
            results.append({
                "component": component,
                "scores": component_scores,
                "score_dict": score_dict,
                "total_score": round(total_score, 2)
            })
        
        # Sort by total score (descending) and add rank
        results.sort(key=lambda x: x["total_score"], reverse=True)
        for rank, result in enumerate(results, start=1):
            result["rank"] = rank
        
        return results


# Singleton instance
_scoring_service = ScoringService()


def get_scoring_service() -> ScoringService:
    """Get the scoring service singleton."""
    return _scoring_service

