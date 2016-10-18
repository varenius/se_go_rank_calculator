(function(angular, $, _, moment) {
	angular.module('rankApp').controller('playerListController', ['$uibModalInstance','$scope', 'selectPlayer', 'players', 'ranks', function($uibModalInstance, $scope, selectPlayer, players, ranks) {
        console.log('im a controller', arguments);
        
        $scope.players = players;

        $scope.selectEgdPin = function (egdPin) {
            selectPlayer(egdPin);
            $scope.close();
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
	}]);

})(angular, jQuery, _, moment);
