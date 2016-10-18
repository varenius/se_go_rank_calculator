(function(angular, $, _, moment) {
    angular.module('rankApp').service('ranks', function() {
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

        return ranks;
    });

})(angular, jQuery, _, moment);