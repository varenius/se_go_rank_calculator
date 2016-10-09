from __future__ import print_function, unicode_literals, absolute_import, division
# This file uses the same convention for assigning integer values to ranks as
# Robert's javascript app.


def check_dan_wins(matches, desired_rank):
    """"""
    if desired_rank <= 30:  # 1k
        return True
    required_dan_wins = desired_rank - 30
    dan_wins = sum([m[0] >= desired_rank for m in matches if m[1]])
    return dan_wins >= required_dan_wins


def required_matches(desired_rank):
    if desired_rank >= 32:  # 2d or higher
        return 20
    elif desired_rank == 31:  # 1d
        return 17
    elif desired_rank == 30:  # 1k
        return 13


def required_points(desired_rank):
    if desired_rank >= 32:  # 2d or higher
        return 200
    elif desired_rank == 31:  # 1d
        return 150
    elif desired_rank == 30:  # 1k
        return 100


def points_for_match(match, current_rank):
    """return point score for one match."""
    other_rank, win = match
    rank_diff = other_rank - current_rank
    if rank_diff >= 3:  # Three or more ranks stronger
        return 35 if win else 0
    elif rank_diff == 2:  # Two ranks stronger
        return 35 if win else -10
    elif rank_diff == 1:  # One rank stronger
        return 35 if win else -25
    elif rank_diff == 0:  # Same rank
        return 25 if win else -35
    elif rank_diff == 1:  # One rank stronger
        return 10 if win else -35
    elif rank_diff <= 2:  # Two ranks stronger
        return 0 if win else -35
    else:
        assert(False)


def points_for_matches(matches, current_rank, reduce_too_few=False):
    """
    total points for a list of matches.
    If there are not enough matches for the desired rank and reduce_too_few is
    True, points will be deducted according to the rules.
    """
    points = sum(points_for_match(m, current_rank) for m in matches)
    if not reduce_too_few:
        return points

    missing_matches = required_matches(current_rank + 1) - len(matches)
    if missing_matches > 0:
        points -= 10*missing_matches
    return points


if __name__ == "__main__":
    # Test the script with random data.

    import numpy as np

    def random_match(current_rank):
        """return random match against opponent close to your rank."""
        win = bool(np.random.choice([0, 1]))
        other_rank = current_rank + np.random.randint(-2, 3) + np.random.randint(-2, 3)
        return (other_rank, win)

    CURRENT_RANK = 31
    matches = [random_match(CURRENT_RANK) for _ in range(20)]

    print("You need {} points to rank up to {}".format(
        required_points(CURRENT_RANK + 1),
        CURRENT_RANK + 1))

    best_range = (None, None, -np.inf)
    best_current_range = (None, None, -np.inf)
    for start in range(len(matches)):
        for end in range(start, len(matches) + 1):
            points = points_for_matches(
                matches[start:end], CURRENT_RANK, reduce_too_few=True)
            if points > best_range[2]:
                best_range = (start, end, points)
            if start == 0:
                current_points = points_for_matches(matches[start:end], CURRENT_RANK)
                if current_points > best_current_range[2]:
                    best_current_range = (start, end, current_points)

    print("You have at most {} points over {} matches ({} to {})".format(
        best_range[2],
        best_range[1] - best_range[0],
        best_range[0],
        best_range[1] - 1))

    if best_range[2] >= required_points(CURRENT_RANK + 1):
        print("Yay!")
    else:
        print("That is not enough! You currently have {} points over the last {} matches ({} to {}).".format(
        best_current_range[2],
        best_current_range[1] - best_current_range[0],
        best_current_range[0],
        best_current_range[1] - 1))

    print(check_dan_wins(matches, CURRENT_RANK + 1))

    for i, match in enumerate(matches):
        print(i, match, points_for_match(match, CURRENT_RANK))
