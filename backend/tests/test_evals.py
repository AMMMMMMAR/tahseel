import pytest

from evals.evaluators import evaluate_scenario
from evals.run_evals import main, run_benchmarks
from evals.scenarios import EVAL_SCENARIOS


def test_eval_scenarios_dataset_integrity():
    """Ensures the evaluation dataset contains 20 unique and well-formed scenarios."""
    assert len(EVAL_SCENARIOS) == 20

    ids = [s.id for s in EVAL_SCENARIOS]
    assert len(ids) == len(set(ids)), "Scenario IDs must be unique"

    for s in EVAL_SCENARIOS:
        assert s.expected_level in (0, 1, 2, 3, 4)
        assert s.amount > 0
        assert len(s.client_name) > 0


@pytest.mark.parametrize("scenario", EVAL_SCENARIOS, ids=[s.id for s in EVAL_SCENARIOS])
def test_individual_scenario_benchmark(scenario):
    """Verifies that each individual debtor scenario passes all criteria."""
    result = evaluate_scenario(scenario)
    assert result.passed, f"Scenario {scenario.id} failed with errors: {result.errors}"
    assert result.strategy_match, f"Strategy mismatch in {scenario.id}"
    assert result.hallucination_free, f"Hallucination detected in {scenario.id}"
    assert result.compliance_pass, f"Compliance failure in {scenario.id}"
    assert result.guardrail_pass, f"Guardrail failure in {scenario.id}"


def test_benchmark_overall_metrics_quality_gate():
    """
    CI Quality Gate: Enforces strict quantitative thresholds:
    - Overall Pass Rate: >= 95%
    - Strategy Precision: >= 95%
    - Anti-Hallucination Rate: 100%
    - Compliance Rate: >= 95%
    """
    results = run_benchmarks()
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    pass_rate = (passed / total) * 100

    strat_rate = (sum(1 for r in results if r.strategy_match) / total) * 100
    hal_rate = (sum(1 for r in results if r.hallucination_free) / total) * 100
    comp_rate = (sum(1 for r in results if r.compliance_pass) / total) * 100

    assert pass_rate >= 95.0, f"Benchmark pass rate {pass_rate:.1f}% below 95% threshold"
    assert strat_rate >= 95.0, f"Strategy precision {strat_rate:.1f}% below 95% threshold"
    assert hal_rate == 100.0, f"Hallucination rate {hal_rate:.1f}% is not 100% clean"
    assert comp_rate >= 95.0, f"Compliance rate {comp_rate:.1f}% below 95% threshold"


def test_safety_guardrails_prevent_unwanted_reminders():
    """Verifies that settled and disputed accounts are strictly shielded from collection."""
    settled_scen = next(s for s in EVAL_SCENARIOS if s.is_settled)
    disputed_scen = next(s for s in EVAL_SCENARIOS if s.is_disputed)

    res_settled = evaluate_scenario(settled_scen)
    assert res_settled.predicted_level == 0
    assert res_settled.guardrail_pass is True

    res_disputed = evaluate_scenario(disputed_scen)
    assert res_disputed.predicted_level == 0
    assert res_disputed.guardrail_pass is True


def test_cli_runner_execution():
    """Tests that the CLI benchmark runner executes successfully with returncode 0."""
    exit_code = main()
    assert exit_code == 0
