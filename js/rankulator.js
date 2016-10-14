(function(angular, $, _, moment) {
	var module = angular.module('rankApp', []);

	module.factory('egd', ['$http', '$q', function($http, $q) {
        var ranks = [];

        for (i = 30; i > 0; i--) {
            ranks.push({
                text: i + ' kyu',
                shortName: i + 'k',
                val: 30 - i
            });
        };
        // add relative points up to 7 dan
        for (i = 0; i < 7; i++) {
            ranks.push({
                text: (i + 1) + ' dan',
                shortName: (i + 1) + 'd',
                val: i + 30
            });
        };

        // set 8d and 9d to same points as 7d
        ranks.push({
            text: 8 + ' dan',
            shortName: 8 + 'd',
            val: 36
        });
            ranks.push({
            text: 9 + ' dan',
            shortName: 9 + 'd',
            val: 36
        });

        // set all pro ranks equal to 7d in point value
        for (i = 0; i < 9; i++) {
            ranks.push({
                text: (i + 1) + ' pro',
                shortName: (i + 1) + 'p',
                val: 36
            });
        };

        return {
            getHtml: function (egdPin) {
                var defered = $q.defer();

                var url = 'php/getEGD.php?egdPin=' + egdPin;

                $http({
                    method: 'GET',
                    url: url
                }).success(function(result) {
                    defered.resolve(result);
                });

                return defered.promise;
            },
            parseHtml: function (pageHtml) {
                var defered = $q.defer(),
                    page = $(pageHtml),
                    rows = $('table[width="650"]>tbody>tr', page),
                    result = [];

                rows.each(function (index, row) {
                    var fields = row.children;
                    if (index == 0) { return; } // header

                    var game = {
                        tournamentCode: fields[0].children[0].innerText,
                        tournamentName: $(fields[2].children[0]).attr('title'),
                        date: moment(fields[1].innerText, 'DD/MM/YYYY')._d,
                        round: fields[3].innerText,
                        lastName: fields[4].innerText,
                        firstName: fields[5].innerText,
                        rank: _.find(ranks, function (r) { return r.shortName == fields[8].innerText }),
                        result: $(fields[10].children[0]).attr('src') == './Immagini/Win.gif'
                    };
                    if (!(game.tournamentName.includes('IGS-PandaNet'))) {
                        result.push(game);
                    };
                });

                result = _.sortBy(result, function (game) { return game.round; });
                result = _.sortBy(result, function (game) { return game.date; });
                defered.resolve(result.reverse());
                return defered.promise;
            },
            ranks: ranks
        };
    }]);

	module.filter('moment', [function () {
		return function (value, format) {
			if (!value) { return "-"; }
			return moment(value).format(format);
		};
	}]);

	module.controller('rankCtrl', ['$scope', 'egd', function($scope, egd) {
        var i;
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
            if ($scope.start !== -1 && $scope.isMarked(index)) {
                var s = $scope.games.slice($scope.start, index+1);
                window.s = s;
                console.log(s);
                return _.reduce(s, function (m, g) {
                    return $scope.pointsForGame(g) + m;
                }, 0);
            }
        }

        $scope.getGames = function() {
            $scope.isSearching = true;
            egd.getHtml($scope.egdPin).then(egd.parseHtml).then(function (res) {
                $scope.games = res;
                $scope.findBestRange(res);
                $scope.checkDanGames(res);
                $scope.isSearching = false;
            });
        };

        $scope.requiredPoints = function (rank) {
            if (rank.val >= 31)  // 2d or higher
                return 200;
            else if (rank.val == 30) // 1d
                return 150;
            else if (rank.val == 29) // 1k
                return 100;
            console.dir(rank);
            crash();
        };

        $scope.requiredGames = function (rank) {
            if (rank.val >= 31)  // 2d or higher
                return 20;
            else if (rank.val == 30) // 1d
                return 17;
            else if (rank.val == 29) // 1k
                return 13;
            console.dir(rank);
            crash();
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
            else if (rankDiff == 1)  // Opponent is one rank weaker
                return game.result ? 10 : -35;
            else if (rankDiff <= 2)  // Opponent is two ranks weaker
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
                for (end = start; end <= games.length; end++) {
                    slice = games.slice(start, end);
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
            console.dir(bestRange);
            console.dir(bestCurrentRange);
            $scope.bestRange = bestRange
            $scope.bestCurrentRange = bestCurrentRange
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
        }
        $scope.updatePoints = function () {
        $scope.findBestRange($scope.games);
        $scope.checkDanGames($scope.games);
        }

        $scope.start = -1;
        $scope.stop = -1;

        $scope.egdPin = 14986906;
        $scope.ranks = egd.ranks;
        $scope.desiredRank = $scope.ranks[29];

        $scope.bestRange = {};
        $scope.bestCurrentRange = {};
		}
	]);

})(angular, jQuery, _, moment);
