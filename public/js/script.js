var vocabularyApp = angular.module('vocabulary-app', ['ngRoute']);

vocabularyApp.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
        when('/:tliId', {
            controller: 'IndexCtrl',
            template: ''
        }).
        when('/:tliId/edit', {
            templateUrl: '/public/html/teacher_view.html',
            controller: 'TeacherCtrl'
        }).
        when('/:tliId/practice', {
            templateUrl: '/public/html/student_view.html',
            controller: 'StudentCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
});

vocabularyApp.controller('IndexCtrl', function($http, $location, $routeParams) {
    $http.get('/api/init').then(function(result) {
        if(result.data.userType === 'teacher') {
            $location.path('/' + $routeParams.tliId + '/edit');
        } else if(result.data.userType === 'student') {
            $location.path('/' + $routeParams.tliId + '/practice');
        } else {
            console.err('Unknown userType');
        }
    });
});

vocabularyApp.controller('TeacherCtrl', function($scope, $http, $routeParams) {
    $http.get('/api/vocabulary/' + $routeParams.tliId).then(function(result) {
        $scope.vocabularyData = result.data;
    });

    $scope.addWord = function() {
        $scope.vocabularyData.words.push({originalLanguage: '', translatedLanguage: ''});
    };

    $scope.removeWord = function(index) {
        $scope.vocabularyData.words.splice(index, 1);
    };

    $scope.save = function() {
        $http.put('/api/vocabulary/' + $routeParams.tliId, $scope.vocabularyData).then(function(result) {
            $scope.vocabularyData = result.data;
        });
    };
});

vocabularyApp.controller('StudentCtrl', function($scope, $http, $routeParams) {
    $http.get('/api/vocabulary/' + $routeParams.tliId).then(function(result) {
        $scope.vocabularyData = result.data;
    });

    $scope.correct = function() {
        $http.put('/api/correct/' + $routeParams.tliId, $scope.vocabularyData).then(function(result) {
            $scope.vocabularyData = result.data;

            $scope.numCorrect = 0;
            $scope.vocabularyData.words.forEach(function(wordPair) {
                if(wordPair.correct) {
                    $scope.numCorrect++;
                }
            });
            $scope.message = $scope.numCorrect + ' / ' + $scope.vocabularyData.words.length + ' rätt';
        });
    };
});
