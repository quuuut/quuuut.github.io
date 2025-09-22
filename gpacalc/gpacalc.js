(() => {
var studentID;
if (document.querySelector("daymap-nav")) {
    studentID = parseInt(document.querySelector("daymap-nav").getAttribute("avatar-path").split("/").slice(-1)[0]);
} else {
    if (_studentID) {
        studentID = _studentID;
    } else {
        DMU.toast({message: "This script does not work on this page", toastStyle: "error"});
    }
}
var weightedGpas = [];

function roundToGPAConstant(value) {
    var allowedValues = [];
    for (var i = 0; i <= 15; i++) {
        allowedValues.push(i + 0.00, i + 0.14, i + 0.29, i + 0.43, i + 0.57, i + 0.71, i + 0.84);
    }
   
    var closest = allowedValues[0];
    var minDiff = Math.abs(value - closest);
   
    for (var i = 1; i < allowedValues.length; i++) {
        var diff = Math.abs(value - allowedValues[i]);
        if (diff < minDiff) {
            minDiff = diff;
            closest = allowedValues[i];
        }
    }
   
    return closest;
}

function gradeToNumber(grade) {
    var gradeMap = {
        'A+': 15, 'A': 14, 'A-': 13,
        'B+': 12, 'B': 11, 'B-': 10,
        'C+': 9, 'C': 8, 'C-': 7,
        'D+': 6, 'D': 5, 'D-': 4,
        'E+': 3, 'E': 2, 'E-': 1,
        'F': 0
    };
    return gradeMap[grade] || 0;
}

var term = prompt("Enter Term (1, 2, 3, or 4, to do multiple use spaces, such as '1 2')");

fetch("/daymap/curriculum/ResultFilters.aspx", {
  "headers": {
    "accept": "text/html"
  },
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}).then(function (resp) {
  try {
    resp.text().then(function (text) {
      DMU.toast({message: "Calculating average...", toastStyle: "info"});
     
      var promises = [];
      new DOMParser().parseFromString(text, "text/html").querySelectorAll("optgroup[label]")[1].childNodes.forEach((el) => {
        term.split(" ").forEach((t) => {
          if (el.innerText == `${new Date().getFullYear()} Term ${t}`) {
            var promise = fetch('/daymap/student/portfolio.aspx/AssessmentReport', {
              'headers': {
                'content-type': 'application/json'
              },
              'body': `{'id':${studentID},'classId':0,'viewMode':'tabular','allCompleted':false,'taskType':0,'fromDate':'${el.value.split("|")[2]}T00:00:00.000Z','toDate':'${el.value.split("|")[3]}T00:00:00.000Z'}`,
              'method': 'POST',
              'mode': 'cors',
              'credentials': 'include'
            }).then(function (response) {
              return response.text().then(function (text) {
                var doc = new DOMParser().parseFromString(text, 'text/html');
                
                var tables = doc.querySelectorAll('tbody');
                var tempWeightedGpas = [];
                
                tables.forEach((table) => {
                  var rows = table.querySelectorAll('tr');
                  var subjectGradeSum = 0;
                  var subjectWeightSum = 0;
                  var hasWeightedTotal = false;
                  var subjectGPA = 0;
                  
                  rows.forEach((row) => {
                    var cells = row.querySelectorAll('td, th');
                    if (cells.length >= 5) {
                      if (cells[4] && cells[4].innerHTML.includes('Weighted total')) {
                        var weightedTotal = parseFloat(cells[4].innerHTML.match(/(\d+(?:\.\d+)?)%/)?.[1] || 0);
                        if (weightedTotal > 0) {
                          // Don't convert, use the actual GPA from the next row
                          hasWeightedTotal = true;
                        }
                      }
                      else if (cells[4] && cells[4].innerHTML.includes('GPA for')) {
                        var schoolGPA = parseFloat(cells[4].innerHTML.match(/GPA for [^:]+: ([\d.]+)/)?.[1] || 0);
                        subjectGPA = schoolGPA;
                      }
                      else if (cells[2] && cells[3] && !hasWeightedTotal) {
                        var weight = parseFloat(cells[2].innerText);
                        var grade = cells[3].innerText.trim();
                        if (weight > 0 && grade && grade !== 'Type' && grade !== 'Weighting') {
                          var gradeNum = gradeToNumber(grade);
                          subjectGradeSum += gradeNum * weight;
                          subjectWeightSum += weight;
                        }
                      }
                    }
                  });
                  
                  if (subjectGPA > 0) {
                    tempWeightedGpas.push(subjectGPA);
                  }
                  else if (subjectWeightSum > 0) {
                    var calculatedGPA = (subjectGradeSum / subjectWeightSum);
                    tempWeightedGpas.push(calculatedGPA);
                  }
                });
                
                weightedGpas = weightedGpas.concat(tempWeightedGpas);
              });
            });
            promises.push(promise);
          }
        });
      });
     
      Promise.all(promises).then(function() {
        var weightedAvg = weightedGpas.length ? (weightedGpas.reduce((a,b) => a+b, 0) / weightedGpas.length) : 0;
        
        setTimeout(function(){
          DMU.toast({message: roundToGPAConstant(weightedAvg), toastStyle: "success"});
        }, 300);
      });
    });
  } catch (e) {
    DMU.toast({message: `Error: ${e}`, toastStyle: "error"});
  }
});
})();