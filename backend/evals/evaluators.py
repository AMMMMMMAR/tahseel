from dataclasses import dataclass, field
from typing import List

from app.agent.tools import generate_reminder_message
from evals.scenarios import EvalScenario


@dataclass
class ScenarioResult:
    """Stores quantitative evaluation results for a single scenario."""
    scenario_id: str
    title: str
    category: str
    passed: bool
    strategy_match: bool
    hallucination_free: bool
    compliance_pass: bool
    guardrail_pass: bool
    predicted_level: int
    expected_level: int
    generated_text: str
    errors: List[str] = field(default_factory=list)


def evaluate_scenario(scenario: EvalScenario) -> ScenarioResult:
    """
    Evaluates an Arabic debtor scenario against strategy selection,
    amount anti-hallucination, and regulatory tone compliance.
    """
    # 1. Execute agent logic
    output = generate_reminder_message(
        client_name=scenario.client_name,
        amount=scenario.amount,
        days_overdue=scenario.days_overdue,
        description=scenario.bond_description,
        bond_number=scenario.bond_number,
        risk_score=scenario.risk_score,
        is_disputed=scenario.is_disputed,
        is_settled=scenario.is_settled,
    )

    strategy = output["strategy"]
    predicted_level = strategy["level"]
    predicted_urgency = strategy["urgency"]
    body = output["body"]

    errors: List[str] = []

    # ── Check 1: Strategy Precision & Guardrail ──────────────────────────────
    strategy_match = (predicted_level == scenario.expected_level)
    if not strategy_match:
        errors.append(
            f"Strategy Level mismatch: expected {scenario.expected_level}, got {predicted_level}"
        )

    if scenario.expected_urgency != "none" and predicted_urgency != scenario.expected_urgency:
        errors.append(
            f"Urgency mismatch: expected {scenario.expected_urgency}, got {predicted_urgency}"
        )

    guardrail_pass = True
    if scenario.is_settled or scenario.is_disputed:
        if predicted_level != 0:
            guardrail_pass = False
            errors.append("Guardrail violation: settled or disputed debt must not trigger collection messages.")

    # ── Check 2: Anti-Hallucination & Amount Integrity ────────────────────────
    hallucination_free = True
    if scenario.expected_level > 0:
        # Check formatted amount
        amt_str_2dec = f"{scenario.amount:,.2f}"
        amt_str_0dec = f"{scenario.amount:,.0f}"
        if amt_str_2dec not in body and amt_str_0dec not in body:
            hallucination_free = False
            errors.append(f"Amount hallucination / missing: neither '{amt_str_2dec}' nor '{amt_str_0dec}' found in body.")

        # Check currency notation
        if "ر.س" not in body and "ريال" not in body:
            hallucination_free = False
            errors.append("Missing Saudi currency notation ('ر.س' or 'ريال').")

        # Check bond reference number
        if scenario.bond_number and scenario.bond_number not in body:
            hallucination_free = False
            errors.append(f"Missing bond number reference '{scenario.bond_number}' in message.")

        # Check calculated installment for Level 3
        if scenario.expected_level == 3:
            installment_val = f"{scenario.amount / 3.0:,.2f}"
            if installment_val not in body:
                hallucination_free = False
                errors.append(f"Installment calculation hallucination: expected '{installment_val}' in body.")

    # ── Check 3: Tone & Regulatory Compliance ─────────────────────────────────
    compliance_pass = True
    if scenario.expected_level > 0:
        # Client name in salutation
        if scenario.client_name not in body:
            compliance_pass = False
            errors.append(f"Missing client name '{scenario.client_name}' in salutation.")

        # Expected keywords
        for kw in scenario.expected_keywords:
            if kw not in body:
                compliance_pass = False
                errors.append(f"Missing expected compliance keyword: '{kw}'")

        # Forbidden keywords (anti-harassment check)
        for fkw in scenario.forbidden_keywords:
            if fkw in body:
                compliance_pass = False
                errors.append(f"Harassment / forbidden regulatory keyword detected: '{fkw}'")

    overall_passed = strategy_match and hallucination_free and compliance_pass and guardrail_pass

    return ScenarioResult(
        scenario_id=scenario.id,
        title=scenario.title,
        category=scenario.category,
        passed=overall_passed,
        strategy_match=strategy_match,
        hallucination_free=hallucination_free,
        compliance_pass=compliance_pass,
        guardrail_pass=guardrail_pass,
        predicted_level=predicted_level,
        expected_level=scenario.expected_level,
        generated_text=body,
        errors=errors,
    )
