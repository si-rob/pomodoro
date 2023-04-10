let timerState = {
    running: false,
    endTime: null,
};

function startTimer(timerDuration) {
    timerState.running = true;
    timerState.endTime = new Date().getTime() + timerDuration * 1000;
    chrome.storage.local.set({ timerState: timerState });
}

function stopTimer() {
    timerState.running = false;
    timerState.endTime = null;
    chrome.storage.local.set({ timerState: timerState });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startTimer") {
        startTimer(request.timerDuration);
        sendResponse({ result: "Timer started" });
    } else if (request.action === "stopTimer") {
        stopTimer();
        sendResponse({ result: "Timer stopped" });
    } else if (request.action === "getTimerState") {
        chrome.storage.local.get("timerState", function (data) {
            if (data.timerState) {
                timerState = data.timerState;
            }
            sendResponse(timerState);
        });
        return true; // Required to use sendResponse asynchronously
    }
});
