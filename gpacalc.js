/* this bit code by redisnotblue (modified by quuuut)*/
var studentID;
if (document.querySelector("daymap-nav")) {
    studentID = parseInt(document.querySelector("daymap-nav").getAttribute("avatar-path").split("/").slice(-1)[0]);
} else {
    if (_studentID) {
        studentID = _studentID;
    } else {
        LoopToast.showError("Switch to another page", "This script does not work on this page")
    }
}
/* ends here */

var count = 0; 
var sum = 0; 
var gpas = []; 
var avgGPA;

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

var term = prompt("Enter Term (1, 2, 3, or 4, to do multiple use spaces, such as '1 2')");
var currentYear = new Date().getFullYear()
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
      LoopToast.showInfo("Calculating", "Calculating average...");
      
      var promises = [];
      new DOMParser().parseFromString(text, "text/html").querySelector("optgroup[label]").childNodes.forEach((el) => {
        term.split(" ").forEach((t) => {
          if (el.innerText == `Term ${t}`) {
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
                new DOMParser().parseFromString(text, 'text/html').querySelectorAll('b').forEach((el) => {
                  if (el.innerText.includes("GPA")) {
                    var gpa = Number(el.innerText.split(": ")[1]);
                    gpas.push(gpa);
                    sum += gpa;
                    count++;
                  }
                });
              });
            });
            promises.push(promise);
          }
        });
      });
      
      Promise.all(promises).then(function() {
        avgGPA = count ? (sum/count) : 0;
        setTimeout(function(){
          LoopToast.showSuccess("Predicted GPA", round ? roundToGPAConstant(avgGPA) : avgGPA);
        }, 300);
      });
    });
  } catch (e) {
    LoopToast.showError("Error while fetching report:", e);
  }
});