angular.module('CoCompareApp')
  .controller('ViewComparisonCtrl', function ($scope, $http, $location, $routeParams, UserProvider) {
    'use strict';

    var comparison,
      scores,
      subjects,
      userId,
      criteria,
      hash = $routeParams.hash,
      user = UserProvider.getUser();

    $scope.loggedIn = (user.id > 0);

    var refresh = $scope.refresh = function(){
      $scope.loading = true;
      // TODO: use config.params argument of $http.get()
      // TODO: use fbId instead of userId for better security?
      $http.get('/api/comparison/' + hash + '/user/' + user.id)
      .success(function(result){
        comparison = result;
        comparison.hash = hash;
        displayComparison();
        computePoints();
        computeTotalScores();
        $scope.userIsAdmin = result.isAdmin;
        $scope.loading = false;
      }).error(function(){
        $scope.comparisonTitle = 'Comparison NOT FOUND';
      });
    };

    refresh();

    // set defaults for sorting
    $scope.subjPredicate = 'name';
    $scope.subjReverse = 'false';
    $scope.critPredicate = 'name';
    $scope.critReverse = 'false';
    $scope.isWeighted = true;

    var displayComparison = function(){
      $scope.comparisonTitle = comparison.title;
      subjects = $scope.subjects = comparison.subjects;
      criteria = $scope.criteria = comparison.criteria;
      scores = $scope.scores = {};

      for(var i = 0; i < comparison.scores.length; i++){
        scores[comparison.scores[i].name] = {
          description: comparison.scores[i].description,
          points: 0
        };
      }

      for(i = 0; i < criteria.length; i++){
        criteria[i].points = 1;
        // TODO: refactor criteria points
        // (criterion.points and scores[c...] are redundant)
        scores['c' + criteria[i].index] = {
          points: 1
        };
      }
    };

    var computePoints = function(){
      for(var i = 0; i < comparison.votes.length; i++){
        var vote = comparison.votes[i];
        scores[vote.name].points += vote.value;

        // if vote is for a criterion, then update criterion points
        if(vote.name[0] === 'c'){
          var critIndex = vote.name.slice(1);
          for(var j = 0; j < criteria.length; j++){
            if(criteria[j].index.toString() === critIndex){
              criteria[j].points += vote.value;
            }
          }
        }
      }
    };

    var computeTotalScores = $scope.computeTotalScores = function(){
      var criteriaTotal = 0;
      for(var i = 0; i < criteria.length; i++){
        var subScore = criteria[i].points;
        if(subScore > 0){
          criteriaTotal += subScore;
        }
      }

      for(i = 0; i < subjects.length; i++){
        subjects[i].totalScore = 0;
        for(var j = 0; j < criteria.length; j++){
          var criterionKey = 'c' + criteria[j].index;
          var cellKey = 's' + subjects[i].index + criterionKey;
          // Math.max is used because we don't want negative weights to be applied
          if($scope.isWeighted){
            subjects[i].totalScore += (Math.max(scores[criterionKey].points, 0) /
              criteriaTotal) * scores[cellKey].points;
            // round to nearest tenth
            subjects[i].totalScore = Math.round(subjects[i].totalScore * 10)/10;
          } else {
            subjects[i].totalScore += scores[cellKey].points;
          }
        }
      }
    };

    $scope.submitVote = function(value, crit, subj){
      if($scope.loggedIn){
        var postData = {
          comparisonId: comparison.comparisonId,
          name: 'c' + crit.index,
          value: value,
          userId: user.id
        };

        // check if vote is NOT for a criterion
        if(subj){
          postData.name = 's' + subj.index + postData.name;
        }

        $http.post('/api/vote/', postData).success(refresh);
      } else {
        $scope.showLoginRequest = true;
      }
    };

    $scope.deleteComparison = function(){
      $http.delete('/api/comparison/' + hash + '/user/' + user.id)
      .success(function(){
        $location.url('/');
      }).error(function(err){
        // tell user the bad news
      });
    };

    $scope.closeLoginRequest = function(){
      $scope.showLoginRequest = false;
    };

  });
