const GET_API = "https://script.google.com/macros/s/AKfycbybCb1oy7aaLMwY6adGcGwb307z1CNDFW_E5n-14Nl5hsJJl2TTkg88t9HCm3nXYeQFGQ/exec";


let questions;
let results;
let selectedPackage = ""; // Lưu gói câu hỏi đã chọn

  const packageSelection = document.getElementById("package-selection");
  const questionPackages = document.getElementById("question-packages");
  const startQuizButton = document.getElementById("start-quiz");
  const quizTimer = document.querySelector("#timer");
  const quizProgress = document.querySelector("#progress");
  const quizProgressText = document.querySelector("#progress_text");
  const quizSubmit = document.querySelector("#quiz_submit");
  const quizPrev = document.querySelector("#quiz_prev");
  const quizNext = document.querySelector("#quiz_next");
  const quizCount = document.querySelector(".quiz_question h5");
  let quizAnswers = document.querySelectorAll(".quiz_question ul li");
  let quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
  let quizAnswersItem = document.querySelectorAll(".quiz_answer_item");
  const quizQuestionList = document.querySelector(".quiz_numbers ul");
  const quizTitle = document.querySelector("#quiz_title");
  let currentIndex = null;
  let listSubmit = []; // Lưu index đáp án đã chọn
  let listResults = []; // Lưu index kết quả đúng, theo mảng đã random
  let ass = "Code";
  let isSubmit = false;
  
  async function fetchQuestionPackages() {
    try {
        const response = await fetch(`${GET_API}?action=getPackages`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const packages = await response.json();
        console.log("Fetched Packages:", packages);

        if (!Array.isArray(packages) || packages.length === 0) {
            throw new Error("No packages found or incorrect data format");
        }

        // Hiển thị các gói câu hỏi trong dropdown
        packages.forEach((pkg) => {
            const option = document.createElement("option");
            option.value = pkg.tag; // Giá trị là `tag` để dùng khi gọi API lấy câu hỏi
            option.textContent = pkg.name; // Hiển thị tên gói câu hỏi
            questionPackages.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load packages:", error);
        alert("Failed to load question packages. Please check the API connection or data format.");
    }
}

  startQuizButton.addEventListener("click", () => {
    selectedPackage = questionPackages.value;
    if (!selectedPackage) {
        alert("Vui lòng chọn gói câu hỏi.");
        return;
    }

    // Ẩn lựa chọn gói và bắt đầu quiz
    packageSelection.style.display = "none";
    quiz.start(selectedPackage);
  });

  function randomArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  

  const quiz = {
    randomQuestions: function () {
      questions = randomArray(questions);
      questions.forEach((q) => {
        q.answers = randomArray(q.answers);
      });
      console.log(questions);
    },

    async getQuestions(tag) {
      try {
        const response = await fetch(`${GET_API}?tag=${tag}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No questions found or incorrect data format");
        }
        questions = data; // Gán mảng câu hỏi vào biến `questions`
        // console.log("Questions loaded:", questions);
      } catch (error) {
        console.error("Failed to load questions:", error);
        alert("Failed to load questions. Please check the API connection or data format.");
      }
    },    
    
    getResult: async function () {
      const postData = {
        tag: selectedPackage,
        questions: questions
      }
      const response = await fetch(GET_API, {
        method: "POST",
        body: JSON.stringify(postData)
      });
      const data = await response.json();
      results = data;
      console.log(results);
    },
    
    renderQuestionList: function () {
      let render = "";
      questions.forEach((question, index) => {
        render += `<li>${index + 1}</li>`;
      });
      quizQuestionList.innerHTML = render;
      quizQuestions = document.querySelectorAll(".quiz_numbers ul li"); // Cập nhật lại quizQuestions
    },
    
    renderCurrentQuestion: function () {
      quizCount.innerText = `Question ${currentIndex + 1} of ${questions.length}`;
      quizTitle.innerText = questions[currentIndex].question;
      
      quizAnswersItem = document.querySelectorAll(".quiz_answer_item"); // Cập nhật lại quizAnswersItem
      quizAnswersItem.forEach((answer, index) => {
        if (questions[currentIndex].answers[index]) {
          answer.innerText = questions[currentIndex].answers[index];
        } else {
          answer.innerText = ""; // Hoặc một giá trị mặc định nếu không có câu trả lời
        }
      });
    },
    
    
    renderProgress: function () {
      quizProgress.style = `stroke-dasharray: 0 9999;`;
      quizProgressText.innerText = `0/${questions.length}`;
    },
    renderTimer: function () {
      var timer = 900; // 15 phút
      let _this = this;
      var countdownElement = document.getElementById("timer");
    
      function updateTimer() {
        if (isSubmit) {
          clearInterval(intervalId);
          return;
        }
    
        var hours = Math.floor(timer / 3600);
        var minutes = Math.floor((timer % 3600) / 60);
        var seconds = timer % 60;
    
        var timerString =
          (hours < 10 ? "0" : "") +
          hours +
          ":" +
          (minutes < 10 ? "0" : "") +
          minutes +
          ":" +
          (seconds < 10 ? "0" : "") +
          seconds;
    
        countdownElement.innerHTML = timerString;
    
        timer--;
        if (timer < 0) {
          countdownElement.innerHTML = "Hết thời gian!";
          _this.handleCheckResults();
          clearInterval(intervalId); // Dừng timer khi hết thời gian
        }
      }
    
      updateTimer(); // Hiển thị thời gian ngay lập tức
      var intervalId = setInterval(updateTimer, 1000);
    },
    
    renderResults: function () {
      // Kiểm tra xem currentIndex, listResults[currentIndex] và quizAnswers có hợp lệ không
      if (
        currentIndex !== null &&
        listResults[currentIndex] !== undefined &&
        listResults[currentIndex] >= 0 && // Chỉ xử lý nếu giá trị >= 0
        quizAnswers.length > 0 &&
        quizAnswers[listResults[currentIndex]] !== undefined
      ) {
        // Loại bỏ class incorrect trước khi thêm class active
        quizAnswers.forEach((item) => {
          item.classList.remove("incorrect");
        });
        quizAnswers[listResults[currentIndex]].classList.add("active");
      } else {
        // Xử lý trường hợp giá trị không hợp lệ
        console.error(
          "Error: Cannot access classList because the element is undefined for listResults."
        );
        console.log("Current Index:", currentIndex);
        console.log("List Results:", listResults);
        console.log("Quiz Answers Length:", quizAnswers.length);
      }
    
      // Kiểm tra đáp án đã chọn và kết quả đúng
      if (
        listSubmit[currentIndex] !== undefined &&
        listSubmit[currentIndex] !== listResults[currentIndex] &&
        quizAnswers[listSubmit[currentIndex]] !== undefined
      ) {
        quizAnswers[listSubmit[currentIndex]].classList.add("incorrect");
      } else if (
        listSubmit[currentIndex] !== listResults[currentIndex] &&
        listSubmit[currentIndex] !== undefined
      ) {
        console.error(
          "Error: Cannot access classList because the element is undefined for listSubmit."
        );
      }
    },
      
        
    handleProgress: function (correct) {
      const r = quizProgress.getAttribute("r");
      if (!isSubmit) {
        const progressLen = listSubmit.filter((item) => item >= 0);
        quizProgress.style = `stroke-dasharray: ${
          (2 * Math.PI * r * progressLen.length) / questions.length
        } 9999;`;
        quizProgressText.innerText = `${progressLen.length}/${questions.length}`;
      } else {
        quizProgress.style = `stroke-dasharray: ${
          (2 * Math.PI * r * correct) / questions.length
        } 9999;`;
        quizProgressText.innerText = `${correct}/${questions.length}`;
      }
    },
    handleQuestionList: function () {
      quizQuestions.forEach((item, index) => {
        item.addEventListener("click", () => {
          item.scrollIntoView({
            behavior: "smooth",
            inline: "center",
          });
          quizQuestions.forEach((item) => item.classList.remove("active"));
          item.classList.add("active");
          currentIndex = index;
          this.renderCurrentQuestion();
          quizAnswers.forEach((item) => item.classList.remove("active"));
          const selected = listSubmit[currentIndex];
          selected >= 0 && quizAnswers[selected].click();
          if (isSubmit) {
            this.renderResults();
          }
        });
      });
      quizQuestions[0].click();
    },
    handleAnswer: function () {
      quizAnswers.forEach((answer, index) => {
        answer.addEventListener("click", () => {
          if (!isSubmit) {
            quizAnswers.forEach((item) => item.classList.remove("active"));
            answer.classList.add("active");
            quizQuestions[currentIndex].classList.add("selected");
            listSubmit[currentIndex] = index;
            console.log(listSubmit);
            this.handleProgress();
            // Note
            ++currentIndex;
            quizQuestion[currentIndex].click();
          } else {
            return;
          }
        });
      });
    },
    handleNext: function () {
      quizNext.addEventListener("click", () => {
        ++currentIndex;
        if (currentIndex > questions.length - 1) {
          currentIndex = 0;
        }
        quizQuestions[currentIndex].click();
      });
    },
    handlePrev: function () {
      quizPrev.addEventListener("click", () => {
        --currentIndex;
        if (currentIndex < 0) {
          currentIndex = questions.length - 1;
        }
        quizQuestions[currentIndex].click();
      });
    },
    handleSubmit: function () {
      quizSubmit.addEventListener("click", () => {
        const progressLen = listSubmit.filter((item) => item >= 0);
        if (progressLen.length === questions.length) {
          this.handleCheckResults();
        } else {
          alert("Bạn chưa chọn hết đáp án");
        }
      });
    },
    
    handleCheckResults: async function () {
      await this.getResult();
  
      // Kiểm tra nếu `results` không có kết quả
      if (!results || results.length === 0) {
          console.error('Không có kết quả nào được trả về từ API.');
          return;
      }
  
      let correct = 0;
  
      questions.forEach((item, index) => {
          const result = results.find((r) => r.quiz_id === item.quiz_id);
  
          if (!result || result.answer === undefined) {
              console.error(`No valid result found for question ID ${item.quiz_id}`);
              return;
          }
  
          if (item.answers[listSubmit[index]] === result.answer) {
              listResults[index] = listSubmit[index];
              correct++;
          } else {
              quizQuestions[index].classList.add("incorrect");
              listResults[index] = item.answers.indexOf(result.answer);
          }
      });
  
      isSubmit = true;
      this.handleProgress(correct);
      this.renderResults();
  },
  
  handleKeyDown: function () {
    document.addEventListener("keydown", (e) => {
      if (isSubmit) return; // Ngăn di chuyển nếu đã nộp bài
      switch (e.key) {
        case "ArrowRight":
          quizNext.click();
          break;
        case "ArrowLeft":
          quizPrev.click();
          break;
        default:
          break;
      }
    });
  },
  
    render: function () {
      this.renderQuestionList();
      this.renderProgress();
      this.renderTimer();
    },
    handle: function () {
      this.handleQuestionList();
      this.handleAnswer();
      this.handleNext();
      this.handlePrev();
      this.handleKeyDown();
      this.handleSubmit();
    },
    start: async function (tag) {
      await this.getQuestions(tag);
      this.randomQuestions();
      this.render();
      this.handle();
    },
  };

  window.onload = fetchQuestionPackages;