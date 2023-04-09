let timerInterval;

function updateTimerState(newState) {
    chrome.storage.local.set({ timerState: newState });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startTimer") {
        const endTime = new Date().getTime() + request.timerDuration * 1000;

        timerInterval = setInterval(() => {
            const remainingTime = endTime - new Date().getTime();
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                updateTimerState({ running: false });
            }
        }, 1000);

        updateTimerState({ running: true, endTime: endTime });

        sendResponse({ result: "Timer started" });
    } else if (request.action === "stopTimer") {
        clearInterval(timerInterval);

        updateTimerState({ running: false });

        sendResponse({ result: "Timer stopped" });
    } else if (request.action === "getTimerState") {
        chrome.storage.local.get("timerState", function (data) {
            sendResponse(data.timerState);
        });
        return true; // Required to use sendResponse asynchronously
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "pomodoroTimer") {
        // Play an alarm sound or show a notification
        updateTimerState({ running: false });
    }
});
