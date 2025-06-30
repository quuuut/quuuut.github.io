javascript: var round = true; var rounddecimals = 2;var count = 0; var sum = 0; var term = prompt("Enter Term (1, 2, 3, or 4, to do multiple use spaces, such as '1 2')");
fetch("/daymap/curriculum/ResultFilters.aspx", {
    "headers": {
      "accept": "text/html"
    },
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  }).then(function(resp) {
      resp.text().then(function(text) {
          LoopToast.showInfo("Calculating", "Calculating average...");
          new DOMParser().parseFromString(text, "text/html").querySelector("optgroup[label]").childNodes.forEach((el) => {
              term.split(" ").forEach((t) => {
                if (el.innerText == `Term ${t}`) {
                  fetch('/daymap/student/portfolio.aspx/AssessmentReport', {
                    'headers': {
                      'content-type': 'application/json'
                    },
                    'body': `{'id':${_studentID},'classId':0,'viewMode':'tabular','allCompleted':false,'taskType':0,'fromDate':'${el.value.split("|")[2]}T00:00:00.000Z','toDate':'${el.value.split("|")[3]}T00:00:00.000Z'}`,
                    'method': 'POST',
                    'mode': 'cors',
                    'credentials': 'include'
                  }).then(function(response) {
                    response.text().then(function(text) {
                      new DOMParser().parseFromString(text, 'text/html').querySelectorAll('b').forEach((el) => {
                        if (el.innerText.includes('GPA')) {
                          var gpa = Number(el.innerText.split(': ')[1]);
                          count++;
                          sum += gpa
                        }
                      });
                      
                    })
                  })
                }
              })
              });
          });
    setTimeout(()=>{
    LoopToast.showSuccess("Predicted GPA", round ? Math.round(sum / count * Math.pow(10,rounddecimals)) / Math.pow(10,rounddecimals) : sum / count)},300)
      })
