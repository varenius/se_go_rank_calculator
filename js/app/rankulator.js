(function(angular, $, _, moment) {
	angular.module('rankApp').controller('rankCtrl', ['$scope', 'egd', 'ranks', '$uibModal', function($scope, egd, ranks, $uibModal) {
        var i;
        function getNextRank(rank) {
            if (!rank || rank.val < 29) {
                return $scope.ranks[29];
            }

            if (rank.val >= 35) {
                return $scope.ranks[35];
            }

            return $scope.ranks[rank.val + 1];
        }

        $scope.selectableRankFilter = function (rank) {
            return rank.val >= 29 && rank.val <= 35;
        };

        $scope.mark = function (index) {
            if ($scope.start == -1) {
                $scope.start = index;
                $scope.stop = index;
            } else if (index < $scope.start) {
                $scope.start = index;
            } else {
                $scope.stop = index;
            }
        };

        $scope.isMarked = function (index) {
            return index >= $scope.start && index <= $scope.stop;
        };

        $scope.resetMarks = function () {
            $scope.start = -1;
            $scope.stop = -1;
        };

        $scope.pointsForMarkedGames = function (index) {
            if ($scope.stop !== -1 && $scope.isMarked(index)) {
                var s = $scope.games.slice(index, $scope.stop+1);
                window.s = s;
                return _.reduce(s, function (m, g) {
                    return $scope.pointsForGame(g) + m;
                }, 0);
            }
        };

        $scope.getGames = function() {
            $scope.games = null;
            $scope.isSearching = true;
            $scope.resetMarks();
            egd.getGamesHtml($scope.search.egdPin).then(egd.parseGamesHtml).then(function (res) {
                $scope.playerName = res.fullname;
                $scope.search.firstname = '';
                $scope.search.lastname = '';
                $scope.declaredRank = res.declaredRank;
                $scope.desiredRank = getNextRank(res.declaredRank);

                $scope.games = res.games;
                $scope.findBestRange(res.games);
                $scope.checkDanGames(res.games);
                $scope.isSearching = false;
            });
        };

        $scope.switchToOpponent = function (egdPin) {
            $scope.search.egdPin = egdPin;

            $scope.getGames();
        };

        $scope.requiredPoints = function (rank) {
            if (rank.val >= 31)  // 2d or higher
                return 200;
            else if (rank.val == 30) // 1d
                return 150;
            else if (rank.val == 29) // 1k
                return 100;
        };

        $scope.requiredGames = function (rank) {
            if (rank.val >= 31)  // 2d or higher
                return 20;
            else if (rank.val == 30) // 1d
                return 17;
            else if (rank.val == 29) // 1k
                return 13;
        };

        $scope.pointsForGame = function (game) {
            if (!$scope.desiredRank) { return 0; }

            var rankDiff = game.rank.val - ($scope.desiredRank.val - 1);

            if (rankDiff >= 3)  // Opponent is three or more ranks stronger
                return game.result ? 35 : 0;
            else if (rankDiff == 2)  // Opponent is two ranks stronger
                return game.result ? 35 : -10;
            else if (rankDiff == 1)  // Opponent is one rank stronger
                return game.result ? 35 : -25;
            else if (rankDiff == 0)  // Opponent is same rank
                return game.result ? 25 : -35;
            else if (rankDiff == -1)  // Opponent is one rank weaker
                return game.result ? 10 : -35;
            else if (rankDiff <= -2)  // Opponent is two ranks weaker
                return game.result ? 0 : -35;
        };

        $scope.pointsForGames = function (games) {
            var res = {
                points: 0,
                requiredGames: 0,
                reduced: 0,
                basePoints: 0,
            };
            for (i = 0; i < games.length; i++)
                res.basePoints += $scope.pointsForGame(games[i])

            res.requiredGames = $scope.requiredGames($scope.desiredRank)
            missingGames = res.requiredGames - games.length
            if (missingGames > 0) {
                res.reduced = 10*missingGames;
                res.points = res.basePoints - 10*missingGames;
            } else {
                res.points = res.basePoints;
            }
            return res;
        };

        $scope.findBestRange = function (games) {
            /*
             * Go through all possible ranges of games and find the one
             * that gives the most points.
             */
            var points = 0
            var bestRange = null;
            var bestCurrentRange = null;
            for (start = 0; start < games.length; start++) {
                for (end = start; end < games.length; end++) {
                    slice = games.slice(start, end+1);
                    var pointsObj = $scope.pointsForGames(slice);
                    if (bestRange == null || pointsObj.points > bestRange.points.points)
                        bestRange = {
                            start: start,
                            end: end,
                            startround: games[start].round,
                            startdate : games[start].date,
                            enddate : games[end].date,
                            endround: games[end].round,
                            points: pointsObj,
                            isEnough: pointsObj.points >= $scope.requiredPoints($scope.desiredRank)
                        };

                    if (start == 0) {
                        var currentPoints = $scope.pointsForGames(slice);
                        if (bestCurrentRange == null || currentPoints.basePoints > bestCurrentRange.points.basePoints)
                            bestCurrentRange = {
                                start: start,
                                end: end,
                                startround: games[start].round,
                                startdate : games[start].date,
                                enddate : games[end].date,
                                endround: games[end].round,
                                points: currentPoints,
                                isEnough: false
                            };
                    }
                }
            }
            $scope.bestRange = bestRange;
            $scope.bestCurrentRange = bestCurrentRange;
        };

        $scope.checkDanGames = function (games) {
            function checkDanGame(game) {
                return game.rank.val >= $scope.desiredRank.val && game.result;
            }
            var required = $scope.desiredRank.val - 29;
            var count = games.filter(checkDanGame).length;
            $scope.danGames = {
                required: required,
                count: count,
                isEnough: count >= required,
            };
        };

        $scope.updatePoints = function () {
            $scope.findBestRange($scope.games);
            $scope.checkDanGames($scope.games);
        };

        $scope.searchPlayers = function () {
            function egdifyName(name) {
                if (!name) { return name }

                return name.replace(/å/gi, 'aa')
                    .replace(/ä/gi, 'ae')
                    .replace(/ö/gi, 'oe')
                    .replace(/[á]/gi, 'a')
                    .replace(/[é]/gi, 'e')
                    .replace(/[í]/gi, 'i')
                    .replace(/[ó]/gi, 'o')
                    .replace(/[ú]/gi, 'u')
                    .replace(/[ý]/gi, 'y');
            }
            $scope.games = null;
            egd.getPlayers(egdifyName($scope.search.lastname), egdifyName($scope.search.firstname)).then(function (players) {
                if (!players || !players.length) { return; }

                if (players.length == 1) {
                    $scope.switchToOpponent(players[0].Pin_Player);
                } else {
                    $uibModal.open({
                        animation: true,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: 'playerListTemplate.html',
                        controller: 'playerListController',
                        resolve: {
                            selectPlayer: function () {
                                return function (egdPin) {
                                    $scope.switchToOpponent(egdPin);
                                }
                            },
                            players: function () { return players; }
                        }
                    });
                }
            });
        };

        $scope.start = -1;
        $scope.stop = -1;

        $scope.ranks = ranks;
        $scope.desiredRank = $scope.ranks[29];

        $scope.bestRange = {};
        $scope.bestCurrentRange = {};

        $scope.search = {
            by: 'name',
            egdPin: 14986906,
            lastname: 'Åhs'
        }
	}]);

})(angular, jQuery, _, moment);
