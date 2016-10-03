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

					// elithaxx
					var url = 'http://anyorigin.com/go?url=' + encodeURIComponent('http://www.europeangodatabase.eu/EGD/Player_Card.php?switch_panel=3&key=' + egdPin);
						
					$http({
						method: 'jsonp',
						url: url + '&callback=JSON_CALLBACK'
					}).success(function(result) {
						defered.resolve(result.contents);
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

						result.push(game);
					});
					
					result = _.sortBy(result, function (game) { return game.round; });
					result = _.sortBy(result, function (game) { return game.date; });
					defered.resolve(result.reverse());
					return defered.promise;
				},
				ranks: ranks
			};
		}
	]);

	module.filter('moment', [function () {
		return function (value, format) {
			if (!value) { return "-"; }
			return moment(value).format(format);
		};
	}]);

	module.controller('rankCtrl', ['$scope', 'egd', function($scope, egd) {
			var i;
		 	$scope.selectableRankFilter = function (rank) {
		        return rank.val >= 29;
		    };

			$scope.getGames = function() {
				$scope.isSearching = true;
				egd.getHtml($scope.egdPin).then(egd.parseHtml).then(function (res) {
					$scope.games = res;
					$scope.isSearching = false;
				});
			};

			$scope.calculatePoints = function (game) {
				if (!$scope.desiredRank) { return 0; }

				var rankDiff = $scope.desiredRank.val - game.rank.val;

				if (rankDiff === 0) {
					return game.result ? 35 : -25;
				}

				if (rankDiff === -1) {
					return game.result ? 35 : -10;
				}

				if (rankDiff < -1) {
					return game.result ? 35 : 0;
				}

				if (rankDiff === 1) {
					return game.result ? 25 : -35;
				}

				if (rankDiff === 2) {
					return game.result ? 10 : -35;
				}

				return game.result ? 0 : -35;
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

			$scope.totalPoints = function (index) {
				if ($scope.start !== -1 && $scope.isMarked(index)) {
					var s = $scope.games.slice($scope.start, index+1);
					window.s = s;
					console.log(s);
					return _.reduce(s, function (m, g) {
						return $scope.calculatePoints(g) + m;
					}, 0);
				}
			}
			$scope.resetMarks = function () { 
				$scope.start = -1;
				$scope.stop = -1;
			};

			$scope.start = -1;
			$scope.stop = -1;

			$scope.egdPin = 14986906;
			$scope.ranks = egd.ranks;
			$scope.desiredRank = $scope.ranks[29];
		}
	]);

})(angular, jQuery, _, moment);
