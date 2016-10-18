(function(angular, $, _, moment) {
	var module = angular.module('rankApp', ['ui.bootstrap']);

	module.filter('moment', [function () {
		return function (value, format) {
			if (!value) { return "-"; }
			return moment(value).format(format);
		};
	}]);

})(angular, jQuery, _, moment);