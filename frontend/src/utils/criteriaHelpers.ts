/**
 * Criteria utility functions.
 *
 * Provides helpers for weight calculations, validation, and common criteria operations.
 */

// Type for objects with weight property (works with both Criterion and CriterionForm)
type Weightable = { weight: number };

/**
 * Calculate total weight of criteria
 */
export const calculateTotalWeight = (criteria: Weightable[]): number => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
};

/**
 * Validate that total weight equals 100
 */
export const isWeightBalanced = (criteria: Weightable[]): boolean => {
    const total = calculateTotalWeight(criteria);
    return Math.abs(total - 100) < 0.01; // Allow small floating point errors
};

/**
 * Get weight balance status message
 */
export const getWeightStatus = (
    criteria: Weightable[]
): {
    isBalanced: boolean;
    message: string;
    className: string;
} => {
    const total = calculateTotalWeight(criteria);
    const isBalanced = isWeightBalanced(criteria);

    if (criteria.length === 0) {
        return {
            isBalanced: false,
            message: "No criteria defined",
            className: "text-gray-600",
        };
    }

    if (isBalanced) {
        return {
            isBalanced: true,
            message: "Weights are balanced (100%)",
            className: "text-green-600",
        };
    }

    if (total < 100) {
        return {
            isBalanced: false,
            message: `Weights total ${total.toFixed(1)}% (need ${(
                100 - total
            ).toFixed(1)}% more)`,
            className: "text-yellow-600",
        };
    }

    return {
        isBalanced: false,
        message: `Weights total ${total.toFixed(1)}% (${(total - 100).toFixed(
            1
        )}% over)`,
        className: "text-red-600",
    };
};

/**
 * Common criteria suggestions by category
 */
export const COMMON_CRITERIA = [
    "Cost",
    "Gain",
    "Size",
    "Power Consumption",
    "Frequency Range",
    "Bandwidth",
    "Efficiency",
    "Temperature Range",
    "Reliability",
    "Availability",
    "Weight",
    "Voltage",
    "Current",
    "Impedance",
    "Noise",
    "Sensitivity",
    "Other",
];
