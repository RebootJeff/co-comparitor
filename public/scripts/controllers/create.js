'use strict';

angular.module('CoCompareApp')
  .controller('CreateCtrl', function ($rootScope, $scope, $http) {
    $scope.loggedIn = !!$rootScope.user && !!$rootScope.user.name;

    // These indexes are used to assign scores to their respective subject & criterion
    var critIndex = 0;
    var subjIndex = 0;

    // These declarations work with live data binding because
    // they deal with arrays/objects, which are mutable.
    var subjects = $scope.subjects = [{
      name: '',
      index: subjIndex
    }];
    var criteria = $scope.criteria = [{
      name: '',
      index: critIndex
    }];
    var scores = $scope.scores = {
      s0c0: {points: 0, description: ''}
    };

    $scope.addSubject = function(){
      subjIndex++;
      subjects.push({name: '', index: subjIndex});
      for(var i = 0; i < criteria.length; i++){
        if(scores['s' + subjIndex + 'c' + criteria[i].index] === undefined){
          scores['s' + subjIndex + 'c' + criteria[i].index] = {points: 0, description: ''};
        }
      }
    };
    $scope.addCriterion = function(){
      critIndex++;
      criteria.push({name: '', index: critIndex});
      for(var i = 0; i < subjects.length; i++){
        if(scores['s' + subjects[i].index + 'c' + critIndex] === undefined){
          scores['s' + subjects[i].index + 'c' + critIndex] = {points: 0, description: ''};
        }
      }
    };

    $scope.removeSubject = function(subject){
      var i = subjects.indexOf(subject);
      if(i !== -1){
        subjects.splice(i, 1);
      }
      for(var key in scores){
        var cIndex = key.indexOf('c');
        if(key.slice(1, cIndex) === subject.index.toString()){
          delete scores[key];
        }
      }
    };
    $scope.removeCriterion = function(criterion){
      var i = criteria.indexOf(criterion);
      if(i !== -1){
        criteria.splice(i, 1);
      }
      for(var key in scores){
        var cIndex = key.indexOf('c');
        if(key.slice(cIndex + 1) === criterion.index.toString()){
          delete scores[key];
        }
      }
    };

    $scope.submit = function(){
      if(!$scope.loggedIn){
        window.alert('You must be logged in to create a new comparison.');
      } else {
        if(!$scope.createForm.$invalid){
          var postData = JSON.stringify({
            comparisonName: $scope.comparisonName,
            subjects: subjects,
            criteria: criteria,
            scores: scores
          });
          $http.post('/api/submit', postData).success(function(responseData){
            $scope.submitted = true;
            $scope.sharePath = '/#/view/' + responseData.hash;
            $scope.shareLink = window.location.origin + $scope.sharePath;
          });
        }
      }
    };

  });
