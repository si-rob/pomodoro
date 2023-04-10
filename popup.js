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

    function updateRemainingTime() {
        chrome.runtime.sendMessage({ action: "getTimerState" }, function (timerState) {
            if (timerState.running) {
                const remainingTime = timerState.endTime - new Date().getTime();
                if (remainingTime > 0) {
                    const remainingSeconds = Math.floor(remainingTime / 1000);
                    updateTimerDisplay(remainingSeconds);
                } else {
                    timerElement.style.backgroundColor = "red";
                    startButton.disabled = false;
                    stopButton.disabled = true;
                    updateTimerDisplay(timerDuration);
                }
            }
        });
    }


    function showNotification() {
        const notificationOptions = {
            type: "basic",
            iconUrl: "icon128.png",
            title: "Pomodoro Timer",
            message: "Time's up!",
        };
        chrome.notifications.create("timerEndNotification", notificationOptions);
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
        const customDuration = parseFloat(this.value);
        if (!isNaN(customDuration) && customDuration > 0) {
            timerDuration = customDuration * 60;
            updateTimerDisplay(timerDuration);
        } else {
            this.value = timerDuration / 60;
        }
    });

    chrome.runtime.sendMessage({ action: "getTimerState" }, function (timerState) {
        timerState = timerState || { running: false }; // Provide a default timer state if not defined

        if (timerState.running) {
            const remainingTime = timerState.endTime - new Date().getTime();
            if (remainingTime > 0) {
                timerDuration = Math.floor(remainingTime / 1000);
                startButton.disabled = true;
                stopButton.disabled = false;
                updateRemainingTime();
            } else {
                timerState.running = false;
                timerState.endTime = null;
            }
        }

        updateTimerDisplay(timerDuration);
        startButton.disabled = timerState.running;
        stopButton.disabled = !timerState.running;
        setInterval(updateRemainingTime, 1000);
    });
};

