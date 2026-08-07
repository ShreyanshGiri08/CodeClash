def calculate_elo(winner_elo: int, loser_elo: int, k: int = 32):
    expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    expected_loser = 1 - expected_winner

    new_winner_elo = round(winner_elo + k * (1 - expected_winner))
    new_loser_elo = round(loser_elo + k * (0 - expected_loser))

    return new_winner_elo, new_loser_elo