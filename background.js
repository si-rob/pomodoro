
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


function showNotification() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Pomodoro Timer",
        message: "Time's up!",
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pomodoro") {
        showNotification();
        playBeep();
        if (popupPort) {
            popupPort.postMessage({ action: "timerEnded" });
        }
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        popupPort = port;
        port.onDisconnect.addListener(() => {
            popupPort = null;
        });

        port.onMessage.addListener((request) => {
            if (request.action === "getTimerState") {
                port.postMessage({ action: "getTimerState", timerState });
            } else if (request.action === "startTimer") {
                if (!timerState.running) {
                    timerState.running = true;
                    timerState.endTime = new Date().getTime() + request.duration * 1000;
                    chrome.alarms.create("pomodoro", { when: timerState.endTime });

                    timerInterval = setInterval(() => {
                        const remainingTime = timerState.endTime - new Date().getTime();
                        if (remainingTime <= 0) {
                            timerState.running = false;
                            timerState.endTime = null;
                            clearInterval(timerInterval);

                            if (popupPort) {
                                popupPort.postMessage({ action: "timerEnded" });
                            }
                        }
                    }, 1000);
                }
            } else if (request.action === "stopTimer") {
                timerState.running = false;
                timerState.endTime = null;
                clearInterval(timerInterval);
            }
        });
    }
});
