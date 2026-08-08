"""
Elo rating calculation service.

Standard Elo formula with a "provisional" period for new accounts:
  - K=40 for first 10 races (more volatile, helps new players find their true rating)
  - K=20 after 10 races (more stable, similar to Codeforces's approach)

The formula:
  Expected score = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
  New elo = old_elo + K * (actual_score - expected_score)

Where actual_score is 1 for a win, 0 for a loss.
"""

import logging

logger = logging.getLogger("codeclash.elo")

# Provisional threshold — first N races use a higher K-factor
PROVISIONAL_RACES = 10
K_PROVISIONAL = 40
K_STANDARD = 20
STARTING_ELO = 1200


def get_k_factor(races_played: int) -> int:
    """
    Return the K-factor based on how many races the player has completed.
    Higher K = more volatile ratings = faster convergence for new players.
    """
    return K_PROVISIONAL if races_played < PROVISIONAL_RACES else K_STANDARD


def calculate_elo(
    winner_elo: int,
    loser_elo: int,
    winner_races: int = PROVISIONAL_RACES,
    loser_races: int = PROVISIONAL_RACES,
) -> tuple[int, int, int, int]:
    """
    Calculate new Elo ratings after a race.

    Returns: (new_winner_elo, new_loser_elo, winner_change, loser_change)

    The change is always symmetric in magnitude but with different K-factors
    per player (a provisional player gains/loses more per game).
    """
    k_winner = get_k_factor(winner_races)
    k_loser = get_k_factor(loser_races)

    # Expected scores (probability of winning based on current ratings)
    expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    expected_loser = 1 - expected_winner

    # New ratings
    winner_change = round(k_winner * (1 - expected_winner))
    loser_change = round(k_loser * (0 - expected_loser))

    new_winner = winner_elo + winner_change
    new_loser = max(0, loser_elo + loser_change)  # Floor at 0

    logger.info(
        "Elo calculated",
        extra={
            "winner_elo": f"{winner_elo} → {new_winner} ({winner_change:+d})",
            "loser_elo": f"{loser_elo} → {new_loser} ({loser_change:+d})",
            "k_winner": k_winner,
            "k_loser": k_loser,
        },
    )

    return new_winner, new_loser, winner_change, loser_change
