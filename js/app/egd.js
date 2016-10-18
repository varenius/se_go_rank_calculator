(function(angular, $, _, moment) {
    	angular.module('rankApp').factory('egd', ['ranks', '$http', '$q', function(ranks, $http, $q) {
       
        return {
            getGamesHtml: function (egdPin) {
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
            parseGamesHtml: function (pageHtml) {
                var defered = $q.defer(),
                    page = $(pageHtml),
                    rows = $('table[width="650"]>tbody>tr', page),
                    names =  $('span.plain5', page).text().split(' ')
                    result = {
                        games: [],
                        firstname: names[0],
                        lastname: names[1],
                        fullname: $('span.plain5', page).text(),
                        declaredRank: _.find(ranks, function (r) { return r.shortName == $('input[name="grade"]', page).val(); })
                    };

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
                        egdPin: $('a', fields[4]).attr('href').match(/\d+/),
                        rank: _.find(ranks, function (r) { return r.shortName == fields[8].innerText }),
                        result: $(fields[10].children[0]).attr('src') == './Immagini/Win.gif'
                    };
                    if (!(game.tournamentName.includes('IGS-PandaNet'))) {
                        result.games.push(game);
                    };
                });

                result.games = _.sortBy(result.games, function (game) { return game.round; });
                result.games = _.sortBy(result.games, function (game) { return game.date; });
                result.games.reverse();
                defered.resolve(result);
                return defered.promise;
            },
            getPlayers: function (lastname, firstname) {
                var defered = $q.defer();
                lastname = lastname || '';
                firstname = firstname || '';
                var url = 'php/getPlayerInfo.php?lastname=' + lastname + '&name=' + firstname ;

                $http({
                    method: 'GET',
                    url: url
                }).success(function(result) {
                    var players = result.players;
                    players = _.sortBy(players, function (p) { return p.Name; });
                    players = _.sortBy(players, function (p) { return p.Last_Name; });
                    players = _.sortBy(players, function (p) { return p.Grade_n; });
                    players.reverse();
                    defered.resolve(players);
                });

                return defered.promise;
            }
        };
    }]);

})(angular, jQuery, _, moment);