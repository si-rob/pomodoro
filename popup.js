document.addEventListener("DOMContentLoaded", () => {
    const port = chrome.runtime.connect({ name: "popup" });

    const timerElement = document.getElementById("timer");
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const presetButtons = document.querySelectorAll(".preset");
    const customInput = document.getElementById("custom");

    let timerDuration = 25 * 60; // Default timer duration (in seconds)

    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    presetButtons.forEach((button) => {
        button.addEventListener("click", () => {
            timerDuration = parseInt(button.dataset.duration);
            updateTimerDisplay(timerDuration);
        });
    });

    customInput.addEventListener("change", () => {
        timerDuration = parseInt(customInput.value) * 60;
        updateTimerDisplay(timerDuration);
    });

    startButton.addEventListener("click", () => {
        port.postMessage({ action: "startTimer", duration: timerDuration });
    });

    stopButton.addEventListener("click", () => {
        port.postMessage({ action: "stopTimer" });
    });

    function updateRemainingTime() {
        port.postMessage({ action: "getTimerState" });
    }

    port.onMessage.addListener((message) => {
        if (message.action === "getTimerState") {
            const timerState = message.timerState;
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
            } else {
                timerElement.style.backgroundColor = "";
                updateTimerDisplay(timerDuration);
            }

            startButton.disabled = timerState.running;
            stopButton.disabled = !timerState.running;
        }
        if (message.action === "stopTimer") {
            timerElement.style.backgroundColor = "";
            updateTimerDisplay(timerDuration);
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    updateRemainingTime();
    setInterval(updateRemainingTime, 1000);
});
