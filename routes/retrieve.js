/*jslint node: true */
'use strict';

exports.retrieve = function(req, res) {
  var models = req.app.get('models');
  var sequelize = models.sequelize;
  var Sequelize = models.Sequelize;
  var responseData = {};
  var hash = req.params.hash;

  var comparisonId;

// TODO: Consider using `include` and/or `Sequelize.Utils.QueryChainer` and/or
// getters from object associations (e.g., `score.getVotes()`).

  sequelize
    .sync()
    .then(function(){
      return models.Comparison.find({ where: {hash: hash} });
    })
    .then(function(comparison){  // TODO: QueryChainer would start here
      responseData.title = comparison.name;
      responseData.comparisonId = comparison.id;
      comparisonId = comparison.id;
      return models.Subject.findAll({ where: {ComparisonId: comparisonId} });
    })
    .then(function(subjects){
      responseData.subjects = Sequelize.Utils._.map(subjects, function(subject){
        return {
          name: subject.name,
          description: subject.description,
          id: subject.id,
          index: subject.index
        };
      });
      return models.Criterion.findAll({ where: {ComparisonId: comparisonId} });
    })
    .then(function(criteria){
      responseData.criteria = Sequelize.Utils._.map(criteria, function(criterion){
        return {
          name: criterion.name,
          description: criterion.description,
          id: criterion.id,
          index: criterion.index
        };
      });
      return models.Score.findAll({ where: {ComparisonId: comparisonId} });
    })
    .then(function(scores){
      responseData.scores = Sequelize.Utils._.map(scores, function(score){
        return {
          name: score.name,
          description: score.description,
          subjectId: score.SubjectId,
          criterionId: score.CriteriumId
        };
      });
      return models.Vote.findAll({ where: {ComparisonId: comparisonId} });
    })
    .then(function(votes){
      responseData.votes = Sequelize.Utils._.map(votes, function(vote){
        return {
          value: vote.value,
          name: vote.name,
          userId: vote.UserId
        };
      });  // TODO: QueryChainer would end here
      res.send(200, responseData);
    },
    function(err){
      console.log('NOTHING FOUND FROM DB');
      res.send(404, err);
    });

};
