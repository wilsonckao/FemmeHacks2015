/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

 $(function() {
    $( "#tabs" ).tabs();
    $("#entryTabs").tabs();
  });

$(document).ready(function() {


  // Jquery variables
  var $content1 = $('.content1'),
    $content2 = $('.content2'),
    $loading = $('.loading'),
    $error = $('.error'),
    $errorMsg = $('.errorMsg'),
    $traits = $('.traits'),
    $results = $('.results');

  /**
   * Clear the "textArea"
   */
  $('.clear-btn').click(function(){
    $('.clear-btn').blur();
    $content1.val('');
    updateWordsCount();
  });

   $('.clear-btnn').click(function(){
    $('.clear-btnn').blur();
    $content2.val('');
    updateWordsCountt();
  });

  /**
   * Update words count on change
   */
  $content1.change(updateWordsCount);
  $content2.change(updateWordsCountt);

  /**
   * Update words count on copy/past
   */
  $content1.bind('paste', function(e) {
    setTimeout(updateWordsCount, 100);
  });
  $content2.bind('paste', function(e) {
    setTimeout(updateWordsCountt, 100);
  });

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */

  // function sendEmail() {
  //   console.log("sendEmail");
  //   var sendgrid = require('sendgrid')('femmehacks', 'isabel')

  //   var payload = {
  //     to :   'kongsally94@gmail.com',
  //     from:    'iren@seas.upenn.edu',
  //     subject: 'You Anowlysis Results',
  //     text :   'This is a test!!'
  //   }
  //   sendgrid.send(payload, function(err,json) {
  //     if (err) { console.error(err); }
  //     console.log(json);
  //   });
  //  }
  // $('.email-btn').click(function(){
  //     sendEmail();
  // });

  $('.analysis-btn').click(function(){
    $('.analysis-btn').blur();
    $loading.show();
    $error.hide();
    $traits.hide();
    $results.hide();

    $.ajax({
      type: 'POST',
      data: {
        text: $content1.val()
      },
      url: '/',
      dataType: 'json',
      success: function(response) {
        $loading.hide();

        if (response.error) {
          showError(response.error);
        } else {
          $results.show();
          showTraits(response);
          showTextSummary(response);
          showVizualization(response);
        }

      },
      error: function(xhr) {
        $loading.hide();
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch(e) {}
        showError(error.error || error);
      }
    });
  });

  $('.analysis-btnn').click(function(){
    $('.analysis-btnn').blur();
    $loading.show();
    $error.hide();
    $traits.hide();
    $results.hide();

    $.ajax({
      type: 'POST',
      data: {
        text: $content2.val()
      },
      url: '/',
      dataType: 'json',
      success: function(response) {
        $loading.hide();

        if (response.error) {
          showError(response.error);
        } else {
          $results.show();
          showTraits(response);
          showTextSummary(response);
          showVizualization(response);
        }

      },
      error: function(xhr) {
        $loading.hide();
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch(e) {}
        showError(error.error || error);
      }
    });
  });

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error || defaultErrorMsg);
  }

  /**
   * Displays the traits received from the
   * Personality Insights API in a table,
   * just trait names and values.
   */


  var cnt = 0;
  function findId(tree, id) {
      var current = tree;
      if (current.id === id) {
        console.log(current);
        return current;
      } else {
        if(current !== undefined && current.children !== undefined) {
          console.log(current);
          for(var i = 0; i < current.children.length; i++) {
              current = findId(current.children[i], id);
              cnt += 1;
          }
        }
      }
  }

  function showTraits(data) {

    $traits.show();

    var traitList = flatten(data.tree),
    table = $traits;

    table.empty();

    // Header
    $('#header-template').clone().appendTo(table);

    // For each trait
    for (var i = 0; i < traitList.length; i++) {
      var elem = traitList[i];

      var Klass = 'row';
      Klass += (elem.title) ? ' model_title' : ' model_trait';
      Klass += (elem.value === '') ? ' model_name' : '';

      if (elem.value !== '') { // Trait child name
        $('#trait-template').clone()
          .attr('class', Klass)
          .find('.tname')
          .find('span').html(elem.id).end()
          .end()
          .find('.tvalue')
            .find('span').html(elem.value === '' ?  '' : (elem.value + ' (± '+ elem.sampling_error+')'))
            .end()
          .end()
          .appendTo(table);
      } else {
        // Model name
        $('#model-template').clone()
          .attr('class', Klass)
          .find('.col-lg-12')
          .find('span').html(elem.id).end()
          .end()
          .appendTo(table);
      }
    }
  }

  /**
   * Construct a text representation for big5 traits crossing, facets and
   * values.
   */
  function showTextSummary(data) {
    console.log('showTextSummary()');
    var paragraphs = [
      assembleTraits(data.tree.children[0]),
      assembleFacets(data.tree.children[0]),
      assembleNeeds(data.tree.children[1]),
      assembleValues(data.tree.children[2])
    ];
    var div = $('.summary-div');
    div.empty();
    paragraphs.forEach(function(sentences) {
      $('<p></p>').text(sentences.join(' ')).appendTo(div);
    });
  }

/* Renders the visualization*/

function showVizualization(theProfile) {
  console.log(theProfile);
  console.log('showVizualization()');
  var intellect = theProfile.tree.children[0].children[0].children[0].children[4];
  var orderliness = theProfile.tree.children[0].children[0].children[1].children[3];
  var selfDiscipline = theProfile.tree.children[0].children[0].children[1].children[4];
  var cooperation = theProfile.tree.children[0].children[0].children[3].children[1];
  var vulnerability = theProfile.tree.children[0].children[0].children[4].children[5];

  var radarData = {
    labels: ["Intellect", "Orderliness", "Self-Discipline", "Cooperation", "Vulnerability"],
    datasets: [
        {
            label: "My First dataset",
            fillColor: "rgba(116, 117, 182,0.2)",
            strokeColor: "rgba(116, 117, 182,1)",
            pointColor: "rgba(116, 117, 182,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(116, 117, 182,1)",
            data: [(intellect.percentage * 100).toFixed(1), 
                  (orderliness.percentage * 100).toFixed(1), 
                  (selfDiscipline.percentage * 100).toFixed(1),
                  (cooperation.percentage * 100).toFixed(1), 
                  (vulnerability.percentage * 100).toFixed(1)]
        }
    ]
  };

  var ctx = document.getElementById("myChart").getContext("2d");
  ctx.canvas.width = 350;
  ctx.canvas.height = 400;
  var myNewChart = new Chart(ctx).Radar(radarData, {
    pointDot: false
  });
 
}

/**
  * Returns a 'flattened' version of the traits tree, to display it as a list
  * @return array of {id:string, title:boolean, value:string} objects
*/
function flatten( /*object*/ tree) {
    var arr = [],
      f = function(t, level) {
        if (!t) return;
        if (level > 0 && (!t.children || level !== 2)) {
          arr.push({
            'id': t.name,
            'title': t.children ? true : false,
            'value': (typeof (t.percentage) !== 'undefined') ? Math.floor(t.percentage * 100) + '%' : '',
            'sampling_error': (typeof (t.sampling_error) !== 'undefined') ? Math.floor(t.sampling_error * 100) + '%' : ''
          });
        }
        if (t.children && t.id !== 'sbh') {
          for (var i = 0; i < t.children.length; i++) {
            f(t.children[i], level + 1);
          }
        }
      };
    f(tree, 0);
    return arr;
  }

  function updateWordsCount() {
    var text = $content1.val();
    var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
    $('.wordsCount').css('color',wordsCount < 100 ? 'red' : 'gray');
    $('.wordsCount').text(wordsCount + ' words');
  }
  $content1.keyup(updateWordsCount);
  updateWordsCount();

   function updateWordsCountt() {
    var text = $content2.val();
    var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
    $('.wordsCount').css('color',wordsCount < 100 ? 'red' : 'gray');
    $('.wordsCount').text(wordsCount + ' words');
  }
  $content2.keyup(updateWordsCountt);
  updateWordsCountt();

});
