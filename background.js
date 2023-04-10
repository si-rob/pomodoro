let timerState = {
    running: false,
    endTime: null,
};

let popupPort = null;

function playBeep() {
    chrome.tts.speak("Time's up!", {
        rate: 0.8,
        lang: "en-US",
        pitch: 1.2,
        volume: 1,
    });
}


chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "popup") {
        popupPort = port;
        port.onDisconnect.addListener(() => {
            popupPort = null;
        });
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startTimer") {
        timerState.running = true;
        timerState.endTime = new Date().getTime() + request.timerDuration * 1000;
        sendResponse({ result: "Timer started" });

        const timerInterval = setInterval(() => {
            const remainingTime = timerState.endTime - new Date().getTime();
            if (remainingTime <= 0) {
                if (popupPort) {
                    popupPort.postMessage({ action: "timerEnded" });
                }
                chrome.runtime.sendMessage({ action: "stopTimer" });
                clearInterval(timerInterval);
                playBeep();
                showNotification();
            }
        }, 1000);
    } else if (request.action === "stopTimer") {
        timerState.running = false;
        timerState.endTime = null;
        sendResponse({ result: "Timer stopped" });
    } else if (request.action === "getTimerState") {
        sendResponse(timerState);
    }
});

function showNotification() {
    const notificationOptions = {
        type: "basic",
        iconUrl: "icon128.png",
        title: "Pomodoro Timer",
        message: "Time's up!",
    };
    chrome.notifications.create("timerEndNotification", notificationOptions);
}
