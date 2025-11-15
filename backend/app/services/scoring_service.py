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
        results = []
        total_weight = sum(c.weight for c in criteria) if criteria else 1
        
        for component in components:
            # Get all scores for this component
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
            
            total_weight_val = float(total_weight)
            total_score = weighted_sum / total_weight_val if total_weight_val > 0 else 0
            
            results.append({
                "component": component,
                "scores": component_scores,
                "score_dict": score_dict,
                "total_score": round(float(total_score), 2)
            })
        
        # Sort by total score (descending)
        results.sort(key=lambda x: x["total_score"], reverse=True)
        
        # Add rank
        for i, result in enumerate(results):
            result["rank"] = i + 1
        
        return results
    
    @staticmethod
    def validate_score_value(score: float, min_val: float = 1, max_val: float = 10) -> int:
        """
        Validate and clamp a score value to valid range.
        
        Args:
            score: Score value to validate
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            Clamped integer score
        """
        return int(max(min_val, min(max_val, int(score))))
    
    @staticmethod
    def calculate_criterion_statistics(
        components: List[Any],
        criterion_id: str,
        scores_dict: Dict[Tuple[str, str], Any]
    ) -> Dict[str, float]:
        """
        Calculate statistics for a criterion across all components.
        
        Args:
            components: List of component objects
            criterion_id: ID of the criterion
            scores_dict: Dict mapping (component_id, criterion_id) to score object
            
        Returns:
            Dictionary with min, max, avg, and count
        """
        scores = []
        for component in components:
            key = (str(component.id), str(criterion_id))
            if key in scores_dict:
                scores.append(scores_dict[key].score)
        
        if not scores:
            return {
                "min": 0,
                "max": 0,
                "avg": 0,
                "count": 0
            }
        
        return {
            "min": min(scores),
            "max": max(scores),
            "avg": sum(scores) / len(scores),
            "count": len(scores)
        }


# Singleton instance
_scoring_service = ScoringService()


def get_scoring_service() -> ScoringService:
    """Get the scoring service singleton."""
    return _scoring_service

