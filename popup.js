window.onload = function () {
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const timerElement = document.getElementById("timer");
    const presetButtons = document.querySelectorAll(".preset");
    const customDurationInput = document.getElementById("customDuration");

    let timerInterval;
    let timerDuration = 25 * 60; // Default duration: 25 minutes

    function updateTimerDisplay(duration) {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function startCountdown() {
        timerInterval = setInterval(function () {
            chrome.runtime.sendMessage({ action: "getTimerState" }, function (timerState) {
                if (timerState.running) {
                    const remainingTime = timerState.endTime - new Date().getTime();
                    if (remainingTime > 0) {
                        const remainingSeconds = Math.floor(remainingTime / 1000);
                        updateTimerDisplay(remainingSeconds);
                    } else {
                        clearInterval(timerInterval);
                        startButton.disabled = false;
                        stopButton.disabled = true;
                    }
                }
            });
        }, 1000);
    }

    function startTimer() {
        startButton.disabled = true;
        stopButton.disabled = false;

        chrome.runtime.sendMessage(
            { action: "startTimer", timerDuration: timerDuration },
            function (response) {
                console.log(response.result);
            }
        );

        startCountdown();
    }

    function stopTimer() {
        startButton.disabled = false;
        stopButton.disabled = true;

        chrome.runtime.sendMessage({ action: "stopTimer" }, function (response) {
            console.log(response.result);
        });

        clearInterval(timerInterval);
    }

    startButton.addEventListener("click", startTimer);
    stopButton.addEventListener("click", stopTimer);

    for (const button of presetButtons) {
        button.addEventListener("click", function () {
            timerDuration = parseInt(this.dataset.duration);
            updateTimerDisplay(timerDuration);
            customDurationInput.value = timerDuration / 60;
        });
    }

    customDurationInput.addEventListener("change", function () {
        const customDuration = parseInt(this.value);
        if (!isNaN(customDuration) && customDuration > 0) {
            timerDuration = customDuration * 60;
            updateTimerDisplay(timerDuration);
        }
    });

    // Fetch the timer state when the popup is opened
    chrome.runtime.sendMessage({ action: "getTimerState" }, function (timerState) {
        timerState = timerState || { running: false }; // Provide a default timer state if not defined

        if (timerState.running) {
            const remainingTime = timerState.endTime - new Date().getTime();
            if (remainingTime > 0) {
                const remainingSeconds = Math.floor(remainingTime / 1000);
                updateTimerDisplay(remainingSeconds);
                startButton.disabled = true;
                stopButton.disabled = false;

                // Call startCountdown if the timer is already running when the popup is opened
                startCountdown();
            }
        }
    });
};
