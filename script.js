const PICO_IP = "http://****";
const JSON_URL = PICO_IP + "/json";


const GOVERNMENT_ID = "GOV-ADMIN-001";
const GOVERNMENT_PASSWORD = "******";


let currentPortal = null;

let currentMachine = "";

let latestData = null;

let connected = false;

let acknowledgedCurrentTamper = false;

let lastTamperSignature = "";

let lastWeight = null;

let weighingStarted = false;

let lastWeightEventTime = 0;

let lastTrust = 100;

const telemetry = {

    time: [],

    weight: [],

    trust: [],

    tiltX: [],
    tiltY: [],
    tiltAngle: [],

    magX: [],
    magY: [],
    magZ: [],

    ldr: [],

    voltage: []

};


let weightHistory =
    JSON.parse(
        localStorage.getItem("mjr_weight_history") || "[]"
    );


let tamperHistory =
    JSON.parse(
        localStorage.getItem("mjr_tamper_history") || "[]"
    );


let trustEvents =
    JSON.parse(
        localStorage.getItem("mjr_trust_events") || "[]"
    );

let complaints =
    JSON.parse(
        localStorage.getItem("mjr_complaints") || "[]"
    );

let newsItems =
    JSON.parse(
        localStorage.getItem("mjr_news") || "[]"
    );

let auditLogs =
    JSON.parse(
        localStorage.getItem("mjr_audit") || "[]"
    );

let tamperCounts = {

    tilt: 0,
    magnet: 0,
    ldr: 0,
    voltage: 0,
    seal: 0

};

const charts = {};

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    setupNavigation();

    renderNews();

    renderConsumerComplaints();

    renderGovernmentComplaints();

    renderGovernmentNews();

    renderAudit();

    updateConnectionUI(false);

});

function loadTheme() {

    const savedTheme =
        localStorage.getItem("mjr_theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        const btn =
            document.getElementById("themeButton");

        if (btn) {
            btn.textContent = "☀";
        }
    }
}


function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "mjr_theme",
        dark ? "dark" : "light"
    );

    const btn =
        document.getElementById("themeButton");

    if (btn) {
        btn.textContent = dark ? "☀" : "☾";
    }

    redrawAllCharts();
}

function openConsumerLogin() {

    hideAllEntryScreens();

    document
        .getElementById("consumerLogin")
        .classList.remove("hidden");
}


function openGovernmentLogin() {

    hideAllEntryScreens();

    document
        .getElementById("governmentLogin")
        .classList.remove("hidden");
}


function backToLanding() {

    hideAllEntryScreens();

    document
        .getElementById("landingPage")
        .classList.remove("hidden");
}


function hideAllEntryScreens() {

    document
        .getElementById("landingPage")
        .classList.add("hidden");

    document
        .getElementById("consumerLogin")
        .classList.add("hidden");

    document
        .getElementById("governmentLogin")
        .classList.add("hidden");

    document
        .getElementById("application")
        .classList.add("hidden");
}

function consumerLogin(event) {

    event.preventDefault();

    const machine =
        document
            .getElementById("consumerMachineNumber")
            .value
            .trim();

    if (!machine) {

        showToast(
            "Enter the machine number.",
            "!"
        );

        return;
    }

    currentPortal = "consumer";

    currentMachine = machine;

    localStorage.setItem(
        "mjr_current_machine",
        machine
    );

    startApplication();

    addAudit(
        "Consumer machine login",
        "Consumer",
        "SUCCESS"
    );
}

function governmentLogin(event) {

    event.preventDefault();

    const id =
        document
            .getElementById("governmentId")
            .value
            .trim();

    const password =
        document
            .getElementById("governmentPassword")
            .value;

    if (
        id === GOVERNMENT_ID &&
        password === GOVERNMENT_PASSWORD
    ) {

        currentPortal = "government";

        currentMachine =
            localStorage.getItem(
                "mjr_current_machine"
            ) || "CONNECTED MACHINE";

        startApplication();

        addAudit(
            "Government official login",
            "Government",
            "SUCCESS"
        );

        showToast(
            "Official access granted.",
            "✓"
        );

    } else {

        showToast(
            "Invalid government ID or password.",
            "!"
        );
    }
}

function startApplication() {

    hideAllEntryScreens();

    document
        .getElementById("application")
        .classList.remove("hidden");

    if (currentPortal === "consumer") {

        document
            .getElementById("consumerNavigation")
            .classList.remove("hidden");

        document
            .getElementById("governmentNavigation")
            .classList.add("hidden");

        document
            .getElementById("portalName")
            .textContent = "Consumer";

        setConsumerMachine();

        showPage("consumerDashboard");

    } else {

        document
            .getElementById("consumerNavigation")
            .classList.add("hidden");

        document
            .getElementById("governmentNavigation")
            .classList.remove("hidden");

        document
            .getElementById("portalName")
            .textContent = "Government";

        showPage("governmentDashboard");

    }

    initCharts();

    beginPolling();

    renderAllTables();

}
function setConsumerMachine() {

    const machine =
        currentMachine || "MACHINE";

    setText(
        "consumerMachineDisplay",
        machine
    );

    setText(
        "overviewMachine",
        machine
    );

    setText(
        "complaintMachine",
        machine
    );

    setText(
        "machineInfoNumber",
        machine
    );

    setText(
        "govMachineNumber",
        machine
    );
}
function setupNavigation() {

    document
        .querySelectorAll(".nav-item[data-page]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    showPage(page);
                }
            );
        });
}


function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );
        });

    const target =
        document.getElementById(pageId);

    if (!target) return;

    target.classList.add(
        "active-page"
    );


    document
        .querySelectorAll(
            ".nav-item[data-page]"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageId
            );

        });


    if (pageId === "consumerTamper") {

        renderConsumerTamper();
    }

    if (pageId === "governmentTamper") {

        renderGovernmentTamper();
    }

    if (pageId === "governmentAlerts") {

        renderGovernmentAlerts();
    }

    if (pageId === "governmentIncidents") {

        renderIncidents();
    }

    if (pageId === "governmentAnalytics") {

        redrawAllCharts();
        renderAnalytics();
    }

    if (pageId === "governmentComplaints") {

        renderGovernmentComplaints();
    }

    if (pageId === "consumerComplaints") {

        renderConsumerComplaints();
    }

    if (pageId === "consumerNews") {

        renderNews();
    }

    if (pageId === "governmentNews") {

        renderGovernmentNews();
    }

    if (pageId === "governmentAudit") {

        renderAudit();
    }

    if (pageId === "consumerTrust") {

        renderTrustEvents();
    }

    if (pageId === "consumerWeight") {

        renderWeightHistory();
        redrawAllCharts();
    }
}

function logout() {

    addAudit(
        "Logout",
        currentPortal === "government"
            ? "Government"
            : "Consumer",
        "SUCCESS"
    );

    currentPortal = null;

    latestData = null;

    stopPolling();

    document
        .getElementById("application")
        .classList.add("hidden");

    document
        .getElementById("landingPage")
        .classList.remove("hidden");
}

let pollingTimer = null;


function beginPolling() {

    if (pollingTimer) {

        clearInterval(
            pollingTimer
        );
    }

    fetchPicoData();

    pollingTimer =
        setInterval(
            fetchPicoData,
            2000
        );
}


function stopPolling() {

    if (pollingTimer) {

        clearInterval(
            pollingTimer
        );

        pollingTimer = null;
    }
}
async function fetchPicoData() {

    try {

        const response =
            await fetch(
                JSON_URL +
                "?t=" +
                Date.now(),
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }

        const data =
            await response.json();

        latestData = data;

        connected = true;

        updateConnectionUI(true);

        processTelemetry(data);

    } catch (error) {

        connected = false;

        updateConnectionUI(false);

        setText(
            "connectionText",
            "OFFLINE"
        );
    }
}


/* =========================================================
   CONNECTION UI
========================================================= */

function updateConnectionUI(isConnected) {

    const text =
        document.getElementById(
            "connectionText"
        );

    const dot =
        document.querySelector(
            ".connection-dot"
        );

    if (!text || !dot) return;

    if (isConnected) {

        text.textContent = "PICO ONLINE";

        text.style.color =
            "var(--green)";

        dot.style.background =
            "var(--green)";

    } else {

        text.textContent = "PICO OFFLINE";

        text.style.color =
            "var(--red)";

        dot.style.background =
            "var(--red)";
    }
}


/* =========================================================
   TELEMETRY PROCESSING
========================================================= */

function processTelemetry(data) {

    const now =
        new Date();

    const time =
        formatTime(now);

    const weight =
        number(
            data.weight,
            0
        );

    const trust =
        number(
            data.trust_score,
            100
        );

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};

    const tamper =
        data.tamper || {};


    /* -----------------------------------------
       TELEMETRY ARRAYS
    ----------------------------------------- */

    telemetry.time.push(time);

    telemetry.weight.push(weight);

    telemetry.trust.push(trust);

    telemetry.tiltX.push(
        number(
            tilt.angle_x,
            0
        )
    );

    telemetry.tiltY.push(
        number(
            tilt.angle_y,
            0
        )
    );

    telemetry.tiltAngle.push(
        calculateTiltMagnitude(
            number(
                tilt.angle_x,
                0
            ),
            number(
                tilt.angle_y,
                0
            )
        )
    );

    telemetry.magX.push(
        number(
            magnet.x,
            0
        )
    );

    telemetry.magY.push(
        number(
            magnet.y,
            0
        )
    );

    telemetry.magZ.push(
        number(
            magnet.z,
            0
        )
    );

    telemetry.ldr.push(
        number(
            ldr.value,
            0
        )
    );

    telemetry.voltage.push(
        number(
            voltage.value,
            0
        )
    );


    trimTelemetry();


    /* -----------------------------------------
       WEIGHT EVENTS
    ----------------------------------------- */

    processWeightEvent(
        weight,
        trust,
        time,
        tamper
    );


    /* -----------------------------------------
       TRUST EVENTS
    ----------------------------------------- */

    processTrustEvent(
        trust,
        time,
        weight,
        tamper
    );


    /* -----------------------------------------
       TAMPER
    ----------------------------------------- */

    processTamper(
        data,
        time
    );


    /* -----------------------------------------
       UI
    ----------------------------------------- */

    updateConsumerUI(
        data,
        time
    );

    updateGovernmentUI(
        data,
        time
    );


    /* -----------------------------------------
       CHARTS
    ----------------------------------------- */

    updateCharts();

}


/* =========================================================
   TRIM TELEMETRY
========================================================= */

function trimTelemetry() {

    const MAX = 80;

    Object.keys(telemetry)
        .forEach(key => {

            while (
                telemetry[key].length >
                MAX
            ) {

                telemetry[key].shift();
            }

        });
}


/* =========================================================
   WEIGHT EVENT DETECTION
========================================================= */

function processWeightEvent(
    weight,
    trust,
    time,
    tamper
) {

    if (lastWeight === null) {

        lastWeight = weight;

        return;
    }


    const difference =
        weight - lastWeight;

    const absDifference =
        Math.abs(difference);


    /*
       A weighing event is created when:
       1. Weight changes meaningfully.
       2. Enough time passed from previous event.
    */

    const MIN_CHANGE = 0.05;

    const MIN_INTERVAL = 2500;


    if (
        absDifference >= MIN_CHANGE &&
        Date.now() - lastWeightEventTime >
        MIN_INTERVAL
    ) {

        const event = {

            id:
                weightHistory.length + 1,

            machine:
                currentMachine,

            date:
                new Date()
                    .toLocaleDateString(),

            time,

            weight:
                round(weight, 3),

            change:
                round(difference, 3),

            trust,

            status:
                tamper.active
                    ? "Tamper"
                    : "Normal"

        };


        weightHistory.unshift(
            event
        );


        if (
            weightHistory.length >
            100
        ) {

            weightHistory =
                weightHistory.slice(
                    0,
                    100
                );
        }


        localStorage.setItem(
            "mjr_weight_history",
            JSON.stringify(
                weightHistory
            )
        );


        lastWeightEventTime =
            Date.now();


        renderWeightHistory();

        updateWeightStats();
    }


    lastWeight = weight;
}


/* =========================================================
   TRUST EVENT
========================================================= */

function processTrustEvent(
    trust,
    time,
    weight,
    tamper
) {

    if (trust !== lastTrust) {

        if (
            trust <
            lastTrust
        ) {

            const event = {

                time,

                previous:
                    lastTrust,

                current:
                    trust,

                drop:
                    lastTrust - trust,

                weight,

                reason:
                    tamper.reasons &&
                    tamper.reasons.length
                        ? tamper.reasons.join(", ")
                        : "Security condition"

            };


            trustEvents.unshift(
                event
            );


            trustEvents =
                trustEvents.slice(
                    0,
                    100
                );


            localStorage.setItem(
                "mjr_trust_events",
                JSON.stringify(
                    trustEvents
                )
            );
        }

        lastTrust = trust;
    }
}


/* =========================================================
   TAMPER PROCESSING
========================================================= */

function processTamper(
    data,
    time
) {

    const tamper =
        data.tamper || {};

    const active =
        Boolean(
            tamper.active
        );


    if (!active) {

        acknowledgedCurrentTamper =
            false;

        lastTamperSignature = "";

        return;
    }


    const reasons =
        Array.isArray(
            tamper.reasons
        )
            ? tamper.reasons
            : [];


    const signature =
        reasons.join("|");


    if (
        signature !==
        lastTamperSignature
    ) {

        const event = {

            id:
                tamperHistory.length + 1,

            time,

            date:
                new Date()
                    .toLocaleDateString(),

            machine:
                currentMachine,

            reasons,

            weight:
                number(
                    data.weight,
                    0
                ),

            trust:
                number(
                    data.trust_score,
                    0
                ),

            tilt:
                data.tilt || {},

            magnet:
                data.magnet || {},

            ldr:
                data.ldr || {},

            voltage:
                data.voltage || {},

            seal:
                data.seal || {},

            acknowledged:
                false,

            resolved:
                false

        };


        tamperHistory.unshift(
            event
        );


        tamperHistory =
            tamperHistory.slice(
                0,
                100
            );


        localStorage.setItem(
            "mjr_tamper_history",
            JSON.stringify(
                tamperHistory
            )
        );


        updateTamperCounters(
            reasons
        );


        acknowledgedCurrentTamper =
            false;

        lastTamperSignature =
            signature;


        showTamperPopup(
            data,
            reasons,
            time
        );


        renderGovernmentAlerts();

        renderConsumerTamper();

        renderGovernmentTamper();

        renderIncidents();
    }


    /*
       If the reason is the same but popup
       hasn't been acknowledged, keep it visible.
    */

    if (
        !acknowledgedCurrentTamper
    ) {

        showTamperPopup(
            data,
            reasons,
            time
        );
    }
}


/* =========================================================
   UPDATE TAMPER COUNTERS
========================================================= */

function updateTamperCounters(
    reasons
) {

    reasons.forEach(reason => {

        const text =
            reason.toUpperCase();

        if (
            text.includes("TILT")
        ) {

            tamperCounts.tilt++;

        } else if (
            text.includes("MAGNET")
        ) {

            tamperCounts.magnet++;

        } else if (
            text.includes("DISPLAY") ||
            text.includes("LDR")
        ) {

            tamperCounts.ldr++;

        } else if (
            text.includes("VOLTAGE")
        ) {

            tamperCounts.voltage++;

        } else if (
            text.includes("SEAL")
        ) {

            tamperCounts.seal++;
        }

    });
}


/* =========================================================
   TAMPER POPUP
========================================================= */

function showTamperPopup(
    data,
    reasons,
    time
) {

    const overlay =
        document.getElementById(
            "tamperOverlay"
        );

    if (!overlay) return;


    setText(
        "tamperReason",
        reasons.length
            ? reasons.join(" • ")
            : "SECURITY EVENT"
    );


    let description =
        "Possible unauthorized interference detected.";


    if (
        reasons.some(
            r =>
                r.toUpperCase()
                    .includes("MAGNET")
        )
    ) {

        description =
            "Possible unauthorized magnetic interference detected.";
    }


    if (
        reasons.some(
            r =>
                r.toUpperCase()
                    .includes("TILT")
        )
    ) {

        description =
            "Unexpected machine movement or tilt detected.";
    }


    if (
        reasons.some(
            r =>
                r.toUpperCase()
                    .includes("DISPLAY")
        )
    ) {

        description =
            "Possible display interference detected.";
    }


    if (
        reasons.some(
            r =>
                r.toUpperCase()
                    .includes("VOLTAGE")
        )
    ) {

        description =
            "Abnormal supply voltage detected.";
    }


    if (
        reasons.some(
            r =>
                r.toUpperCase()
                    .includes("SEAL")
        )
    ) {

        description =
            "Physical security seal has been tripped.";
    }


    setText(
        "tamperDescription",
        description
    );


    setText(
        "tamperMachine",
        currentMachine
    );


    setText(
        "tamperTrust",
        number(
            data.trust_score,
            0
        )
    );


    setText(
        "tamperWeight",
        round(
            number(
                data.weight,
                0
            ),
            3
        ) +
        " kg"
    );


    setText(
        "tamperTime",
        time
    );


    overlay.classList.remove(
        "hidden"
    );


    playTamperBeep();
}


/* =========================================================
   ACKNOWLEDGE TAMPER
========================================================= */

function acknowledgeTamper() {

    acknowledgedCurrentTamper =
        true;


    const overlay =
        document.getElementById(
            "tamperOverlay"
        );

    overlay.classList.add(
        "hidden"
    );


    if (
        tamperHistory.length
    ) {

        tamperHistory[0]
            .acknowledged = true;


        localStorage.setItem(
            "mjr_tamper_history",
            JSON.stringify(
                tamperHistory
            )
        );
    }


    addAudit(
        "Tamper alert acknowledged",
        currentPortal === "government"
            ? "Government"
            : "Consumer",
        "SUCCESS"
    );


    renderConsumerTamper();

    renderGovernmentTamper();

    renderGovernmentAlerts();

    showToast(
        "Tamper alert acknowledged.",
        "✓"
    );
}


/* =========================================================
   TAMper BEEP
========================================================= */

function playTamperBeep() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) return;

        const audio =
            new AudioContext();

        const oscillator =
            audio.createOscillator();

        const gain =
            audio.createGain();

        oscillator.type = "sawtooth";

        oscillator.frequency.value =
            650;

        gain.gain.value =
            0.045;

        oscillator.connect(
            gain
        );

        gain.connect(
            audio.destination
        );

        oscillator.start();

        setTimeout(() => {

            oscillator.stop();

            audio.close();

        }, 180);

    } catch (error) {

        console.log(
            "Audio unavailable."
        );
    }
}


/* =========================================================
   CONSUMER UI
========================================================= */

function updateConsumerUI(
    data,
    time
) {

    const weight =
        number(
            data.weight,
            0
        );

    const trust =
        number(
            data.trust_score,
            100
        );

    const system =
        data.system || {};

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};

    const tamper =
        data.tamper || {};


    setText(
        "consumerWeight",
        round(weight, 3)
    );

    setText(
        "consumerTrust",
        trust
    );

    setText(
        "consumerLastUpdate",
        time
    );


    const tamperActive =
        Boolean(
            tamper.active
        );


    setText(
        "consumerSystemStatus",
        tamperActive
            ? "TAMPER DETECTED"
            : "NORMAL"
    );


    setText(
        "consumerSystemDescription",
        tamperActive
            ? "A security event has been detected. Please review the tamper alert."
            : "All monitored security systems are operating normally."
    );


    updateStatusColor(
        "consumerSystemStatus",
        tamperActive
            ? "red"
            : "green"
    );


    /* -----------------------------------------
       CONSUMER SENSOR STATUS
    ----------------------------------------- */

    updateSimpleSensor(
        "consumerLoadStatus",
        "OK",
        true
    );


    updateSimpleSensor(
        "consumerTiltStatus",
        tilt.status === "TILTED"
            ? "NOT OK"
            : "OK",
        tilt.status !== "TILTED"
    );


    updateSimpleSensor(
        "consumerMagnetStatus",
        magnet.status === "DETECTED"
            ? "NOT OK"
            : "OK",
        magnet.status !== "DETECTED"
    );


    updateSimpleSensor(
        "consumerLdrStatus",
        ldr.status === "TAMPER" ||
        ldr.ml_filter === "FAKE DISPLAY"
            ? "NOT OK"
            : "OK",
        !(
            ldr.status === "TAMPER" ||
            ldr.ml_filter === "FAKE DISPLAY"
        )
    );


    updateSimpleSensor(
        "consumerVoltageStatus",
        voltage.status === "UNSTABLE"
            ? "NOT OK"
            : "OK",
        voltage.status !== "UNSTABLE"
    );


    updateSimpleSensor(
        "consumerSealStatus",
        seal.status === "TRIPPED"
            ? "TRIPPED"
            : "SECURE",
        seal.status !== "TRIPPED"
    );


    /* -----------------------------------------
       TRUST
    ----------------------------------------- */

    updateTrustCircle(
        "consumerTrustCircle",
        trust
    );

    updateTrustCircle(
        "consumerBigTrustCircle",
        trust
    );


    const trustStatus =
        getTrustStatus(
            trust
        );


    setText(
        "consumerTrustStatus",
        trustStatus
    );

    setText(
        "consumerBigTrustStatus",
        trustStatus
    );


    /* -----------------------------------------
       OVERVIEW
    ----------------------------------------- */

    setText(
        "overviewSystem",
        tamperActive
            ? "TAMPER DETECTED"
            : "NORMAL"
    );

    setText(
        "overviewTrust",
        trust
    );

    setText(
        "overviewWeight",
        round(weight, 3)
    );

    setText(
        "overviewSeal",
        seal.status || "SECURE"
    );


    const health =
        getHealthFromData(
            data
        );

    setText(
        "overviewHealth",
        health
    );


    /* -----------------------------------------
       MACHINE INFO
    ----------------------------------------- */

    setText(
        "machineInfoConnection",
        connected
            ? "ONLINE"
            : "OFFLINE"
    );

    setText(
        "machineInfoStatus",
        system.status ||
            "NORMAL"
    );

    setText(
        "machineInfoLastData",
        time
    );


    renderConsumerOverviewSensors(
        data
    );


    renderTrustEvents();

    renderWeightHistory();

    renderConsumerTamper();

    renderConsumerComplaints();

    renderNews();
}


/* =========================================================
   GOVERNMENT UI
========================================================= */

function updateGovernmentUI(
    data,
    time
) {

    const weight =
        number(
            data.weight,
            0
        );

    const trust =
        number(
            data.trust_score,
            100
        );

    const system =
        data.system || {};

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};

    const tamper =
        data.tamper || {};


    /* -----------------------------------------
       BASIC
    ----------------------------------------- */

    setText(
        "govMachineNumber",
        currentMachine
    );

    setText(
        "govLastSeen",
        "Last data: " + time
    );

    setText(
        "govDashboardWeight",
        round(weight, 3)
    );

    setText(
        "govDashboardTrust",
        trust
    );

    setText(
        "govOverviewWeight",
        round(weight, 3) + " kg"
    );

    setText(
        "govOverviewTrust",
        trust
    );

    setText(
        "govOverviewTilt",
        calculateTiltMagnitude(
            number(
                tilt.angle_x,
                0
            ),
            number(
                tilt.angle_y,
                0
            )
        ).toFixed(2) +
        "°"
    );

    setText(
        "govOverviewVoltage",
        number(
            voltage.value,
            0
        ).toFixed(2) +
        " V"
    );

    setText(
        "govOverviewLdr",
        number(
            ldr.value,
            0
        )
    );

    setText(
        "govOverviewMagnet",
        magnet.status ||
            "NORMAL"
    );


    /* -----------------------------------------
       KPI
    ----------------------------------------- */

    setText(
        "govMachines",
        1
    );

    setText(
        "govActiveMachines",
        connected
            ? 1
            : 0
    );

    setText(
        "govRiskMachines",
        trust < 70
            ? 1
            : 0
    );

    setText(
        "govActiveTampers",
        tamper.active
            ? 1
            : 0
    );


    const trustValues =
        telemetry.trust;

    const averageTrust =
        trustValues.length
            ? average(
                trustValues
            )
            : trust;


    setText(
        "govAverageTrust",
        Math.round(
            averageTrust
        ) +
        "%"
    );


    setText(
        "govWeighings",
        weightHistory.length
    );


    /* -----------------------------------------
       SYSTEM BADGE
    ----------------------------------------- */

    const badge =
        document.getElementById(
            "govSystemBadge"
        );

    if (badge) {

        badge.textContent =
            tamper.active
                ? "TAMPER DETECTED"
                : "NORMAL";

        badge.className =
            "status-badge " +
            (
                tamper.active
                    ? "tamper"
                    : "normal"
            );
    }


    /* -----------------------------------------
       GOVERNMENT RAW SENSOR VALUES
    ----------------------------------------- */

    setText(
        "govLoadReading",
        round(weight, 3)
    );

    setText(
        "govTiltReading",
        calculateTiltMagnitude(
            number(
                tilt.angle_x,
                0
            ),
            number(
                tilt.angle_y,
                0
            )
        ).toFixed(2)
    );

    setText(
        "govMagReading",

        number(
            magnet.x,
            0
        ) +
        " / " +
        number(
            magnet.y,
            0
        ) +
        " / " +
        number(
            magnet.z,
            0
        )
    );

    setText(
        "govLdrReading",
        number(
            ldr.value,
            0
        )
    );

    setText(
        "govVoltageReading",
        number(
            voltage.value,
            0
        ).toFixed(2)
    );


    updateHealthPill(
        "govLoadHealth",
        "OK"
    );

    updateHealthPill(
        "govTiltHealth",
        tilt.status === "TILTED"
            ? "TILTED"
            : "OK",
        tilt.status === "TILTED"
            ? "bad"
            : "good"
    );

    updateHealthPill(
        "govMagnetHealth",
        magnet.status === "DETECTED"
            ? "DETECTED"
            : "OK",
        magnet.status === "DETECTED"
            ? "bad"
            : "good"
    );

    updateHealthPill(
        "govLdrHealth",
        ldr.status === "TAMPER" ||
        ldr.ml_filter === "FAKE DISPLAY"
            ? "TAMPER"
            : "OK",
        ldr.status === "TAMPER" ||
        ldr.ml_filter === "FAKE DISPLAY"
            ? "bad"
            : "good"
    );

    updateHealthPill(
        "govVoltageHealth",
        voltage.status === "UNSTABLE"
            ? "UNSTABLE"
            : "OK",
        voltage.status === "UNSTABLE"
            ? "bad"
            : "good"
    );

    updateHealthPill(
        "govSealHealth",
        seal.status === "TRIPPED"
            ? "TRIPPED"
            : "SECURE",
        seal.status === "TRIPPED"
            ? "bad"
            : "good"
    );


    /* -----------------------------------------
       LIVE SENSOR PAGE
    ----------------------------------------- */

    setText(
        "liveWeightValue",
        round(weight, 3)
    );

    setText(
        "liveTrustValue",
        trust
    );

    setText(
        "rawTiltX",
        number(
            tilt.angle_x,
            0
        ).toFixed(2)
    );

    setText(
        "rawTiltY",
        number(
            tilt.angle_y,
            0
        ).toFixed(2)
    );

    setText(
        "rawTiltAngle",
        calculateTiltMagnitude(
            number(
                tilt.angle_x,
                0
            ),
            number(
                tilt.angle_y,
                0
            )
        ).toFixed(2)
    );

    setText(
        "rawTiltX2",
        number(
            tilt.angle_x,
            0
        ).toFixed(2)
    );

    setText(
        "rawTiltY2",
        number(
            tilt.angle_y,
            0
        ).toFixed(2)
    );

    setText(
        "rawVibration",
        tilt.vibration
            ? "TRUE"
            : "FALSE"
    );

    setText(
        "rawTiltStatus",
        tilt.status ||
            "NORMAL"
    );


    setText(
        "rawMagX",
        number(
            magnet.x,
            0
        )
    );

    setText(
        "rawMagY",
        number(
            magnet.y,
            0
        )
    );

    setText(
        "rawMagZ",
        number(
            magnet.z,
            0
        )
    );

    setText(
        "rawMagX2",
        number(
            magnet.x,
            0
        )
    );

    setText(
        "rawMagY2",
        number(
            magnet.y,
            0
        )
    );

    setText(
        "rawMagZ2",
        number(
            magnet.z,
            0
        )
    );

    setText(
        "rawMagStatus",
        magnet.status ||
            "NORMAL"
    );


    setText(
        "liveLdrValue",
        number(
            ldr.value,
            0
        )
    );

    setText(
        "rawLdr",
        number(
            ldr.value,
            0
        )
    );

    setText(
        "rawLdrFilter",
        ldr.ml_filter ||
            "NORMAL"
    );

    setText(
        "rawLdrStatus",
        ldr.status ||
            "NORMAL"
    );


    setText(
        "liveVoltageValue",
        number(
            voltage.value,
            0
        ).toFixed(2)
    );

    setText(
        "rawVoltage",
        number(
            voltage.value,
            0
        ).toFixed(2) +
        " V"
    );

    setText(
        "rawVoltageStatus",
        voltage.status ||
            "NORMAL"
    );


    /* -----------------------------------------
       SEAL
    ----------------------------------------- */

    const sealTripped =
        seal.status === "TRIPPED";


    setText(
        "govSealReading",
        sealTripped
            ? "TRIPPED"
            : "SECURE"
    );

    setText(
        "liveSealStatus",
        sealTripped
            ? "SECURITY SEAL TRIPPED"
            : "SECURITY SEAL SECURE"
    );


    const sealBadge =
        document.getElementById(
            "liveSealBadge"
        );

    if (sealBadge) {

        sealBadge.textContent =
            sealTripped
                ? "TRIPPED"
                : "SECURE";

        sealBadge.className =
            "seal-badge " +
            (
                sealTripped
                    ? "tripped"
                    : "secure"
            );
    }


    const sealIcon =
        document.getElementById(
            "liveSealIcon"
        );

    if (sealIcon) {

        sealIcon.textContent =
            sealTripped
                ? "⚠"
                : "🔐";
    }


    setText(
        "liveSealTime",
        sealTripped
            ? time
            : "No trip recorded."
    );


    updateWeightStats();

    updateTrustStats();

    renderGovernmentMachine();

    renderGovernmentHealthMatrix(
        data
    );

    renderAnalytics();

    renderGovernmentAlerts();

    renderIncidents();
}


/* =========================================================
   SIMPLE SENSOR
========================================================= */

function updateSimpleSensor(
    id,
    text,
    good
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        "● " +
        text;

    element.className =
        good
            ? "sensor-ok"
            : "sensor-bad";
}


/* =========================================================
   HEALTH PILL
========================================================= */

function updateHealthPill(
    id,
    text,
    className = "good"
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        text;

    element.className =
        "health-pill " +
        className;
}


/* =========================================================
   CONSUMER OVERVIEW SENSOR LIST
========================================================= */

function renderConsumerOverviewSensors(
    data
) {

    const container =
        document.getElementById(
            "consumerOverviewSensors"
        );

    if (!container) return;

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};


    const sensors = [

        [
            "Load Cell",
            "OK",
            true
        ],

        [
            "Tilt Sensor",
            tilt.status === "TILTED"
                ? "NOT OK"
                : "OK",
            tilt.status !== "TILTED"
        ],

        [
            "Magnetic Sensor",
            magnet.status === "DETECTED"
                ? "NOT OK"
                : "OK",
            magnet.status !== "DETECTED"
        ],

        [
            "LDR / Display",
            ldr.status === "TAMPER" ||
            ldr.ml_filter === "FAKE DISPLAY"
                ? "NOT OK"
                : "OK",
            !(
                ldr.status === "TAMPER" ||
                ldr.ml_filter === "FAKE DISPLAY"
            )
        ],

        [
            "Voltage Sensor",
            voltage.status === "UNSTABLE"
                ? "NOT OK"
                : "OK",
            voltage.status !== "UNSTABLE"
        ],

        [
            "Security Seal",
            seal.status === "TRIPPED"
                ? "TRIPPED"
                : "SECURE",
            seal.status !== "TRIPPED"
        ]

    ];


    container.innerHTML =
        sensors
            .map(sensor => {

                return `
                    <div class="health-row">
                        <span>${escapeHTML(sensor[0])}</span>

                        <strong
                            class="${
                                sensor[2]
                                    ? "status-table-good"
                                    : "status-table-bad"
                            }"
                        >
                            ● ${escapeHTML(sensor[1])}
                        </strong>
                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   TRUST CIRCLE
========================================================= */

function updateTrustCircle(
    id,
    score
) {

    const circle =
        document.getElementById(id);

    if (!circle) return;

    const safeScore =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    const degree =
        safeScore * 3.6;


    let color =
        "var(--green)";


    if (safeScore < 70) {

        color =
            "var(--yellow)";
    }

    if (safeScore < 40) {

        color =
            "var(--red)";
    }


    circle.style.background =
        `
        conic-gradient(
            ${color} 0deg,
            ${color} ${degree}deg,
            var(--border) ${degree}deg,
            var(--border) 360deg
        )
        `;
}


function getTrustStatus(
    score
) {

    if (score >= 80) {

        return "HIGH TRUST";

    } else if (score >= 60) {

        return "MODERATE TRUST";

    } else if (score >= 40) {

        return "LOW TRUST";

    } else {

        return "CRITICAL";
    }
}


/* =========================================================
   CHART ENGINE
========================================================= */

function initCharts() {

    createChart(
        "consumerWeightChart",
        "line"
    );

    createChart(
        "consumerTrustChart",
        "line"
    );

    createChart(
        "consumerFullWeightChart",
        "line"
    );

    createChart(
        "consumerFullTrustChart",
        "line"
    );

    createChart(
        "govWeightTrustChart",
        "line"
    );

    createChart(
        "govWeightChart",
        "line"
    );

    createChart(
        "govTrustChart",
        "line"
    );

    createChart(
        "govTiltChart",
        "line"
    );

    createChart(
        "govMagChart",
        "line"
    );

    createChart(
        "govLdrChart",
        "line"
    );

    createChart(
        "govVoltageChart",
        "line"
    );

    createChart(
        "analyticsWeight",
        "line"
    );

    createChart(
        "analyticsTrust",
        "line"
    );

    createChart(
        "analyticsTilt",
        "line"
    );

    createChart(
        "analyticsMag",
        "line"
    );

    createChart(
        "analyticsLdr",
        "line"
    );

    createChart(
        "analyticsVoltage",
        "line"
    );
}


function createChart(
    canvasId,
    type
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;


    charts[canvasId] = {

        canvas,

        ctx:
            canvas.getContext(
                "2d"
            ),

        type,

        labels: [],

        datasets: []

    };
}


function updateCharts() {

    drawLineChart(
        "consumerWeightChart",
        telemetry.time,
        [
            {
                label: "Weight",
                data:
                    telemetry.weight
            }
        ],
        "kg"
    );


    drawLineChart(
        "consumerTrustChart",
        telemetry.time,
        [
            {
                label: "Trust",
                data:
                    telemetry.trust
            }
        ],
        "score"
    );


    drawLineChart(
        "consumerFullWeightChart",
        weightHistory
            .slice()
            .reverse()
            .map(
                item =>
                    item.time
            ),
        [
            {
                label: "Weight",
                data:
                    weightHistory
                        .slice()
                        .reverse()
                        .map(
                            item =>
                                item.weight
                        )
            }
        ],
        "kg"
    );


    drawLineChart(
        "consumerFullTrustChart",
        telemetry.time,
        [
            {
                label: "Trust",
                data:
                    telemetry.trust
            }
        ],
        "score"
    );


    drawLineChart(
        "govWeightTrustChart",
        telemetry.time,
        [
            {
                label: "Weight",
                data:
                    telemetry.weight
            },
            {
                label: "Trust",
                data:
                    telemetry.trust
            }
        ],
        "mixed"
    );


    drawLineChart(
        "govWeightChart",
        telemetry.time,
        [
            {
                label: "Weight",
                data:
                    telemetry.weight
            }
        ],
        "kg"
    );


    drawLineChart(
        "govTrustChart",
        telemetry.time,
        [
            {
                label: "Trust",
                data:
                    telemetry.trust
            }
        ],
        "score"
    );


    drawLineChart(
        "govTiltChart",
        telemetry.time,
        [
            {
                label: "Tilt X",
                data:
                    telemetry.tiltX
            },
            {
                label: "Tilt Y",
                data:
                    telemetry.tiltY
            },
            {
                label: "Angle",
                data:
                    telemetry.tiltAngle
            }
        ],
        "degree"
    );


    drawLineChart(
        "govMagChart",
        telemetry.time,
        [
            {
                label: "X",
                data:
                    telemetry.magX
            },
            {
                label: "Y",
                data:
                    telemetry.magY
            },
            {
                label: "Z",
                data:
                    telemetry.magZ
            }
        ],
        "mag"
    );


    drawLineChart(
        "govLdrChart",
        telemetry.time,
        [
            {
                label: "LDR",
                data:
                    telemetry.ldr
            }
        ],
        "ldr"
    );


    drawLineChart(
        "govVoltageChart",
        telemetry.time,
        [
            {
                label: "Voltage",
                data:
                    telemetry.voltage
            }
        ],
        "voltage"
    );


    drawLineChart(
        "analyticsWeight",
        telemetry.time,
        [
            {
                label: "Weight",
                data:
                    telemetry.weight
            }
        ],
        "kg"
    );


    drawLineChart(
        "analyticsTrust",
        telemetry.time,
        [
            {
                label: "Trust",
                data:
                    telemetry.trust
            }
        ],
        "score"
    );


    drawLineChart(
        "analyticsTilt",
        telemetry.time,
        [
            {
                label: "Tilt",
                data:
                    telemetry.tiltAngle
            }
        ],
        "degree"
    );


    drawLineChart(
        "analyticsMag",
        telemetry.time,
        [
            {
                label: "X",
                data:
                    telemetry.magX
            },
            {
                label: "Y",
                data:
                    telemetry.magY
            },
            {
                label: "Z",
                data:
                    telemetry.magZ
            }
        ],
        "mag"
    );


    drawLineChart(
        "analyticsLdr",
        telemetry.time,
        [
            {
                label: "LDR",
                data:
                    telemetry.ldr
            }
        ],
        "ldr"
    );


    drawLineChart(
        "analyticsVoltage",
        telemetry.time,
        [
            {
                label: "Voltage",
                data:
                    telemetry.voltage
            }
        ],
        "voltage"
    );
}


function redrawAllCharts() {

    if (!telemetry.time.length) return;

    updateCharts();
}


/* =========================================================
   CUSTOM CANVAS GRAPH
========================================================= */

function drawLineChart(
    canvasId,
    labels,
    datasets,
    mode
) {

    const chart =
        charts[canvasId];

    if (!chart) return;

    const canvas =
        chart.canvas;

    const ctx =
        chart.ctx;


    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * dpr;

    canvas.height =
        rect.height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const width =
        rect.width;

    const height =
        rect.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (
        !datasets.length ||
        !datasets[0].data.length
    ) {

        drawEmptyChart(
            ctx,
            width,
            height
        );

        return;
    }


    const left =
        55;

    const right =
        18;

    const top =
        22;

    const bottom =
        38;


    const plotWidth =
        width -
        left -
        right;

    const plotHeight =
        height -
        top -
        bottom;


    let allValues = [];


    datasets.forEach(ds => {

        allValues =
            allValues.concat(
                ds.data.filter(
                    Number.isFinite
                )
            );
    });


    if (!allValues.length) {

        drawEmptyChart(
            ctx,
            width,
            height
        );

        return;
    }


    let min =
        Math.min(
            ...allValues
        );

    let max =
        Math.max(
            ...allValues
        );


    if (min === max) {

        min -= 1;
        max += 1;
    }


    const padding =
        (max - min) *
        0.12;


    min -= padding;
    max += padding;


    /*
       Grid
    */

    ctx.strokeStyle =
        getComputedStyle(
            document.body
        )
        .getPropertyValue(
            "--border"
        );

    ctx.lineWidth = 1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            top +
            plotHeight *
            (i / 4);


        ctx.beginPath();

        ctx.moveTo(
            left,
            y
        );

        ctx.lineTo(
            width - right,
            y
        );

        ctx.stroke();


        const value =
            max -
            (
                (max - min) *
                (i / 4)
            );


        ctx.fillStyle =
            getComputedStyle(
                document.body
            )
            .getPropertyValue(
                "--muted"
            );

        ctx.font =
            "9px Inter";

        ctx.fillText(
            formatGraphValue(
                value,
                mode
            ),
            5,
            y + 3
        );
    }


    /*
       X labels
    */

    ctx.fillStyle =
        getComputedStyle(
            document.body
        )
        .getPropertyValue(
            "--muted"
        );

    ctx.font =
        "8px Inter";


    const labelCount =
        Math.min(
            5,
            labels.length
        );


    for (
        let i = 0;
        i < labelCount;
        i++
    ) {

        const index =
            Math.floor(
                i *
                (
                    labels.length - 1
                ) /
                Math.max(
                    1,
                    labelCount - 1
                )
            );


        const x =
            left +
            plotWidth *
            (
                index /
                Math.max(
                    1,
                    labels.length - 1
                )
            );


        ctx.fillText(
            labels[index] || "",
            x - 15,
            height - 12
        );
    }


    /*
       Dataset lines
    */

    const graphColors = [
        "#1677ff",
        "#19c7d8",
        "#19b66b",
        "#f2b84b",
        "#f04444"
    ];


    datasets.forEach(
        (dataset, datasetIndex) => {

            const values =
                dataset.data;


            const color =
                graphColors[
                    datasetIndex %
                    graphColors.length
                ];


            ctx.strokeStyle =
                color;

            ctx.lineWidth =
                2.3;

            ctx.lineJoin =
                "round";

            ctx.lineCap =
                "round";


            ctx.beginPath();


            values.forEach(
                (value, index) => {

                    if (
                        !Number.isFinite(
                            value
                        )
                    ) return;


                    const x =
                        left +
                        plotWidth *
                        (
                            index /
                            Math.max(
                                1,
                                values.length - 1
                            )
                        );


                    const y =
                        top +
                        plotHeight *
                        (
                            1 -
                            (
                                (value - min) /
                                (max - min)
                            )
                        );


                    if (index === 0) {

                        ctx.moveTo(
                            x,
                            y
                        );

                    } else {

                        ctx.lineTo(
                            x,
                            y
                        );
                    }

                }
            );


            ctx.stroke();


            /*
               End point
            */

            if (values.length) {

                const lastIndex =
                    values.length - 1;

                const value =
                    values[lastIndex];


                if (
                    Number.isFinite(
                        value
                    )
                ) {

                    const x =
                        left +
                        plotWidth;

                    const y =
                        top +
                        plotHeight *
                        (
                            1 -
                            (
                                (value - min) /
                                (max - min)
                            )
                        );


                    ctx.fillStyle =
                        color;

                    ctx.beginPath();

                    ctx.arc(
                        x,
                        y,
                        4,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }
            }


            /*
               Legend
            */

            const legendX =
                left +
                datasetIndex *
                100;

            const legendY =
                10;


            ctx.fillStyle =
                color;

            ctx.fillRect(
                legendX,
                legendY,
                7,
                7
            );


            ctx.fillStyle =
                getComputedStyle(
                    document.body
                )
                .getPropertyValue(
                    "--muted"
                );

            ctx.font =
                "8px Inter";

            ctx.fillText(
                dataset.label,
                legendX + 11,
                legendY + 7
            );

        }
    );
}


/* =========================================================
   EMPTY CHART
========================================================= */

function drawEmptyChart(
    ctx,
    width,
    height
) {

    ctx.fillStyle =
        getComputedStyle(
            document.body
        )
        .getPropertyValue(
            "--muted"
        );

    ctx.font =
        "11px Inter";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "Waiting for live telemetry...",
        width / 2,
        height / 2
    );

    ctx.textAlign =
        "left";
}


/* =========================================================
   WEIGHT STATS
========================================================= */

function updateWeightStats() {

    const values =
        telemetry.weight
            .filter(
                Number.isFinite
            );


    if (!values.length) return;


    const min =
        Math.min(
            ...values
        );

    const max =
        Math.max(
            ...values
        );

    const avg =
        average(
            values
        );


    setText(
        "govWeightMin",
        min.toFixed(3)
    );

    setText(
        "govWeightMax",
        max.toFixed(3)
    );

    setText(
        "govWeightAverage",
        avg.toFixed(3)
    );

    setText(
        "liveWeightMin",
        min.toFixed(3)
    );

    setText(
        "liveWeightMax",
        max.toFixed(3)
    );

    setText(
        "liveWeightAvg",
        avg.toFixed(3)
    );

    setText(
        "liveWeightCount",
        weightHistory.length
    );
}


/* =========================================================
   TRUST STATS
========================================================= */

function updateTrustStats() {

    const values =
        telemetry.trust
            .filter(
                Number.isFinite
            );


    if (!values.length) return;


    const min =
        Math.min(
            ...values
        );

    const max =
        Math.max(
            ...values
        );

    const avg =
        average(
            values
        );


    let drops = 0;


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            values[i] <
            values[i - 1]
        ) {

            drops++;
        }
    }


    setText(
        "liveTrustMin",
        min.toFixed(0)
    );

    setText(
        "liveTrustMax",
        max.toFixed(0)
    );

    setText(
        "liveTrustAvg",
        avg.toFixed(0)
    );

    setText(
        "liveTrustDrops",
        drops
    );
}


/* =========================================================
   WEIGHT HISTORY TABLE
========================================================= */

function renderWeightHistory() {

    const smallTable =
        document.getElementById(
            "consumerWeightTable"
        );

    const fullTable =
        document.getElementById(
            "consumerFullWeightTable"
        );


    const history =
        weightHistory.slice(
            0,
            50
        );


    if (smallTable) {

        if (!history.length) {

            smallTable.innerHTML =
                `
                <tr>
                    <td
                        colspan="6"
                        class="empty-table"
                    >
                        Waiting for weighing events...
                    </td>
                </tr>
                `;

        } else {

            smallTable.innerHTML =
                history
                    .slice(0, 8)
                    .map(
                        (item, index) =>
                            `
                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    ${escapeHTML(item.time)}
                                </td>

                                <td>
                                    <strong>
                                        ${item.weight.toFixed(3)}
                                        kg
                                    </strong>
                                </td>

                                <td>
                                    ${
                                        item.change >= 0
                                            ? "+"
                                            : ""
                                    }${item.change.toFixed(3)}
                                </td>

                                <td>
                                    ${item.trust}
                                </td>

                                <td
                                    class="${
                                        item.status === "Normal"
                                            ? "status-table-good"
                                            : "status-table-bad"
                                    }"
                                >
                                    ${escapeHTML(item.status)}
                                </td>

                            </tr>
                            `
                    )
                    .join("");
        }
    }


    if (fullTable) {

        if (!history.length) {

            fullTable.innerHTML =
                `
                <tr>
                    <td
                        colspan="7"
                        class="empty-table"
                    >
                        No weighing events recorded yet.
                    </td>
                </tr>
                `;

        } else {

            fullTable.innerHTML =
                history
                    .map(
                        (item, index) =>
                            `
                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    ${escapeHTML(item.date)}
                                </td>

                                <td>
                                    ${escapeHTML(item.time)}
                                </td>

                                <td>
                                    <strong>
                                        ${item.weight.toFixed(3)}
                                        kg
                                    </strong>
                                </td>

                                <td>
                                    ${
                                        item.change >= 0
                                            ? "+"
                                            : ""
                                    }${item.change.toFixed(3)}
                                </td>

                                <td>
                                    ${item.trust}
                                </td>

                                <td
                                    class="${
                                        item.status === "Normal"
                                            ? "status-table-good"
                                            : "status-table-bad"
                                    }"
                                >
                                    ${escapeHTML(item.status)}
                                </td>

                            </tr>
                            `
                    )
                    .join("");
        }
    }
}


/* =========================================================
   TRUST EVENTS
========================================================= */

function renderTrustEvents() {

    const container =
        document.getElementById(
            "consumerTrustEvents"
        );

    if (!container) return;


    if (!trustEvents.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No trust score changes recorded yet.
            </div>
            `;

        return;
    }


    container.innerHTML =
        trustEvents
            .slice(0, 20)
            .map(
                event =>
                    `
                    <div class="event-item">

                        <div>

                            <strong>
                                Trust decreased
                                ${event.drop} points
                            </strong>

                            <span>
                                ${
                                    escapeHTML(
                                        event.reason
                                    )
                                }
                            </span>

                        </div>

                        <div>

                            <strong>
                                ${event.previous}
                                →
                                ${event.current}
                            </strong>

                            <span>
                                ${escapeHTML(event.time)}
                            </span>

                        </div>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   CONSUMER TAMPER
========================================================= */

function renderConsumerTamper() {

    const table =
        document.getElementById(
            "consumerTamperTable"
        );

    const empty =
        document.getElementById(
            "consumerTamperEmpty"
        );


    if (!table) return;


    if (!tamperHistory.length) {

        if (empty) {

            empty.classList.remove(
                "hidden"
            );
        }

        table.innerHTML = "";

        return;
    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );
    }


    table.innerHTML =
        tamperHistory
            .slice(0, 50)
            .map(
                event =>
                    `
                    <tr>

                        <td>
                            ${escapeHTML(event.time)}
                        </td>

                        <td>
                            <strong class="status-table-bad">
                                Tamper
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                event.reasons.join(", ")
                            )}
                        </td>

                        <td>
                            ${event.trust}
                        </td>

                        <td>
                            ${round(
                                event.weight,
                                3
                            )} kg
                        </td>

                        <td>
                            ${
                                event.acknowledged
                                    ? "Acknowledged"
                                    : "Recorded"
                            }
                        </td>

                    </tr>
                    `
            )
            .join("");
}


/* =========================================================
   GOVERNMENT TAMPER
========================================================= */

function renderGovernmentTamper() {

    const table =
        document.getElementById(
            "governmentTamperTable"
        );

    if (!table) return;


    if (!tamperHistory.length) {

        table.innerHTML =
            `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    No tamper events recorded.
                </td>
            </tr>
            `;

        return;
    }


    table.innerHTML =
        tamperHistory
            .slice(0, 100)
            .map(
                event => {

                    const value =
                        buildTamperValue(
                            event
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(event.time)}
                            </td>

                            <td>
                                ${escapeHTML(
                                    event.machine
                                )}
                            </td>

                            <td
                                class="status-table-bad"
                            >
                                ${escapeHTML(
                                    event.reasons.join(", ")
                                )}
                            </td>

                            <td>
                                ${escapeHTML(value)}
                            </td>

                            <td>
                                ${event.trust + getPenaltyApprox(event)}
                            </td>

                            <td
                                class="status-table-bad"
                            >
                                ${event.trust}
                            </td>

                            <td>
                                ${
                                    event.resolved
                                        ? "Resolved"
                                        : event.acknowledged
                                            ? "Acknowledged"
                                            : "Active"
                                }
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   BUILD TAMPER VALUE
========================================================= */

function buildTamperValue(
    event
) {

    const reason =
        event.reasons.join(" ");

    if (
        reason
            .toUpperCase()
            .includes("MAGNET")
    ) {

        const m =
            event.magnet || {};

        return (
            "X:" +
            number(m.x, 0) +
            " Y:" +
            number(m.y, 0) +
            " Z:" +
            number(m.z, 0)
        );
    }


    if (
        reason
            .toUpperCase()
            .includes("TILT")
    ) {

        const t =
            event.tilt || {};

        return (
            "X:" +
            number(
                t.angle_x,
                0
            ).toFixed(2) +
            "° Y:" +
            number(
                t.angle_y,
                0
            ).toFixed(2) +
            "°"
        );
    }


    if (
        reason
            .toUpperCase()
            .includes("VOLTAGE")
    ) {

        return (
            number(
                event.voltage?.value,
                0
            ).toFixed(2) +
            " V"
        );
    }


    if (
        reason
            .toUpperCase()
            .includes("DISPLAY")
    ) {

        return (
            "LDR " +
            number(
                event.ldr?.value,
                0
            )
        );
    }


    if (
        reason
            .toUpperCase()
            .includes("SEAL")
    ) {

        return "TRIPPED";
    }


    return "Security event";
}


/* =========================================================
   PENALTY APPROXIMATION
========================================================= */

function getPenaltyApprox(
    event
) {

    const reason =
        event.reasons.join(" ")
            .toUpperCase();


    if (
        reason.includes("SEAL")
    ) return 30;

    if (
        reason.includes("MAGNET")
    ) return 25;

    if (
        reason.includes("TILT")
    ) return 20;

    if (
        reason.includes("DISPLAY")
    ) return 20;

    if (
        reason.includes("VOLTAGE")
    ) return 10;

    return 0;
}


/* =========================================================
   GOVERNMENT ALERTS
========================================================= */

function renderGovernmentAlerts() {

    const container =
        document.getElementById(
            "governmentAlertsList"
        );

    const latest =
        document.getElementById(
            "govLatestAlert"
        );


    const activeEvent =
        latestData &&
        latestData.tamper &&
        latestData.tamper.active;


    if (latest) {

        if (activeEvent) {

            const reasons =
                latestData.tamper.reasons || [];


            latest.innerHTML =
                `
                <div
                    class="alert-card active"
                >

                    <div class="alert-card-top">

                        <span class="alert-type">
                            🔴 ACTIVE TAMPER
                        </span>

                        <span class="alert-time">
                            ${formatTime(new Date())}
                        </span>

                    </div>

                    <h3>
                        ${escapeHTML(
                            reasons.join(", ") ||
                            "Security event"
                        )}
                    </h3>

                    <p>
                        Machine:
                        ${escapeHTML(
                            currentMachine
                        )}
                        |
                        Trust:
                        ${number(
                            latestData.trust_score,
                            0
                        )}
                        |
                        Weight:
                        ${round(
                            number(
                                latestData.weight,
                                0
                            ),
                            3
                        )} kg
                    </p>

                </div>
                `;

        } else {

            latest.innerHTML =
                `
                <span>✓</span>
                No active security alerts.
                `;
        }
    }


    if (!container) return;


    if (!tamperHistory.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>✓</div>
                <h2>No alerts</h2>
                <p>No tamper events have been recorded.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        tamperHistory
            .slice(0, 30)
            .map(
                (event, index) =>
                    `
                    <div class="alert-card ${
                        index === 0 &&
                        latestData?.tamper?.active
                            ? "active"
                            : ""
                    }">

                        <div class="alert-card-top">

                            <span class="alert-type">
                                ${
                                    event.acknowledged
                                        ? "SECURITY EVENT"
                                        : "TAMPER ALERT"
                                }
                            </span>

                            <span class="alert-time">
                                ${escapeHTML(
                                    event.time
                                )}
                            </span>

                        </div>

                        <h3>
                            ${escapeHTML(
                                event.reasons.join(", ")
                            )}
                        </h3>

                        <p>
                            Machine:
                            ${escapeHTML(
                                event.machine
                            )}
                            |
                            Trust:
                            ${event.trust}
                            |
                            Weight:
                            ${round(
                                event.weight,
                                3
                            )} kg
                        </p>

                        <div class="alert-actions">

                            <button
                                onclick="viewIncident(${index})"
                            >
                                VIEW INCIDENT
                            </button>

                            <button
                                onclick="acknowledgeHistoryEvent(${index})"
                            >
                                ${
                                    event.acknowledged
                                        ? "ACKNOWLEDGED"
                                        : "ACKNOWLEDGE"
                                }
                            </button>

                            <button
                                onclick="resolveIncident(${index})"
                            >
                                ${
                                    event.resolved
                                        ? "RESOLVED"
                                        : "MARK RESOLVED"
                                }
                            </button>

                        </div>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   ACK HISTORY EVENT
========================================================= */

function acknowledgeHistoryEvent(
    index
) {

    if (
        !tamperHistory[index]
    ) return;


    tamperHistory[index]
        .acknowledged = true;


    localStorage.setItem(
        "mjr_tamper_history",
        JSON.stringify(
            tamperHistory
        )
    );


    addAudit(
        "Tamper history acknowledged",
        "Government",
        "SUCCESS"
    );


    renderGovernmentAlerts();

    renderGovernmentTamper();

    showToast(
        "Event acknowledged.",
        "✓"
    );
}


/* =========================================================
   RESOLVE INCIDENT
========================================================= */

function resolveIncident(
    index
) {

    if (
        !tamperHistory[index]
    ) return;


    tamperHistory[index]
        .resolved = true;


    tamperHistory[index]
        .acknowledged = true;


    localStorage.setItem(
        "mjr_tamper_history",
        JSON.stringify(
            tamperHistory
        )
    );


    addAudit(
        "Tamper incident resolved",
        "Government",
        "SUCCESS"
    );


    renderGovernmentAlerts();

    renderGovernmentTamper();

    renderIncidents();

    showToast(
        "Incident marked resolved.",
        "✓"
    );
}


/* =========================================================
   INCIDENT REPORTS
========================================================= */

function renderIncidents() {

    const container =
        document.getElementById(
            "incidentReports"
        );

    if (!container) return;


    if (!tamperHistory.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>📁</div>
                <h2>No incidents</h2>
                <p>Incident reports will appear when tampering is detected.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        tamperHistory
            .slice(0, 30)
            .map(
                (event, index) =>
                    `
                    <div class="incident-card">

                        <div class="eyebrow">
                            INCIDENT #${String(
                                index + 1
                            ).padStart(
                                3,
                                "0"
                            )}
                        </div>

                        <h3>
                            ${escapeHTML(
                                event.reasons.join(", ")
                            )}
                        </h3>

                        <div class="incident-meta">

                            <div>
                                <span>Machine</span>
                                <strong>
                                    ${escapeHTML(
                                        event.machine
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Time</span>
                                <strong>
                                    ${escapeHTML(
                                        event.time
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Weight</span>
                                <strong>
                                    ${round(
                                        event.weight,
                                        3
                                    )} kg
                                </strong>
                            </div>

                            <div>
                                <span>Trust</span>
                                <strong>
                                    ${event.trust}
                                </strong>
                            </div>

                        </div>

                        <button
                            onclick="viewIncident(${index})"
                        >
                            VIEW FULL INCIDENT
                        </button>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   VIEW INCIDENT
========================================================= */

function viewIncident(
    index
) {

    const event =
        tamperHistory[index];

    if (!event) return;


    setText(
        "incidentModalTitle",
        event.reasons.join(", ")
    );


    const content =
        document.getElementById(
            "incidentModalContent"
        );


    content.innerHTML =
        `
        <div class="incident-meta">

            <div>
                <span>Machine</span>
                <strong>
                    ${escapeHTML(
                        event.machine
                    )}
                </strong>
            </div>

            <div>
                <span>Date</span>
                <strong>
                    ${escapeHTML(
                        event.date
                    )}
                </strong>
            </div>

            <div>
                <span>Time</span>
                <strong>
                    ${escapeHTML(
                        event.time
                    )}
                </strong>
            </div>

            <div>
                <span>Weight</span>
                <strong>
                    ${round(
                        event.weight,
                        3
                    )} kg
                </strong>
            </div>

            <div>
                <span>Trust</span>
                <strong>
                    ${event.trust}
                </strong>
            </div>

            <div>
                <span>Event Status</span>
                <strong>
                    ${
                        event.resolved
                            ? "Resolved"
                            : event.acknowledged
                                ? "Acknowledged"
                                : "Active"
                    }
                </strong>
            </div>

        </div>

        <br>

        <strong>
            Sensor details
        </strong>

        <p>
            Tilt X:
            ${
                number(
                    event.tilt?.angle_x,
                    0
                ).toFixed(2)
            }°
            <br>

            Tilt Y:
            ${
                number(
                    event.tilt?.angle_y,
                    0
                ).toFixed(2)
            }°
            <br>

            Magnetic X:
            ${
                number(
                    event.magnet?.x,
                    0
                )
            }
            <br>

            Magnetic Y:
            ${
                number(
                    event.magnet?.y,
                    0
                )
            }
            <br>

            Magnetic Z:
            ${
                number(
                    event.magnet?.z,
                    0
                )
            }
            <br>

            LDR:
            ${
                number(
                    event.ldr?.value,
                    0
                )
            }
            <br>

            Voltage:
            ${
                number(
                    event.voltage?.value,
                    0
                ).toFixed(2)
            } V
            <br>

            Seal:
            ${
                escapeHTML(
                    event.seal?.status ||
                    "SECURE"
                )
            }
        </p>
        `;


    document
        .getElementById(
            "incidentModal"
        )
        .classList.remove(
            "hidden"
        );
}


function closeIncidentModal() {

    document
        .getElementById(
            "incidentModal"
        )
        .classList.add(
            "hidden"
        );
}


/* =========================================================
   GOVERNMENT MACHINE
========================================================= */

function renderGovernmentMachine() {

    const table =
        document.getElementById(
            "governmentMachineTable"
        );

    if (!table) return;


    const data =
        latestData || {};

    const tamper =
        data.tamper || {};

    const trust =
        number(
            data.trust_score,
            100
        );

    const risk =
        trust < 70 ||
        tamper.active
            ? "AT RISK"
            : "NORMAL";


    table.innerHTML =
        `
        <tr>

            <td>
                <strong>
                    ${escapeHTML(
                        currentMachine
                    )}
                </strong>
            </td>

            <td class="status-table-good">
                ${connected
                    ? "ONLINE"
                    : "OFFLINE"}
            </td>

            <td>
                ${
                    data.system?.status ||
                    "NORMAL"
                }
            </td>

            <td>
                ${trust}
            </td>

            <td>
                ${round(
                    number(
                        data.weight,
                        0
                    ),
                    3
                )} kg
            </td>

            <td
                class="${
                    data.seal?.status === "TRIPPED"
                        ? "status-table-bad"
                        : "status-table-good"
                }"
            >
                ${
                    data.seal?.status ||
                    "SECURE"
                }
            </td>

            <td
                class="${
                    risk === "AT RISK"
                        ? "status-table-bad"
                        : "status-table-good"
                }"
            >
                ${risk}
            </td>

        </tr>
        `;
}


/* =========================================================
   GOVERNMENT HEALTH MATRIX
========================================================= */

function renderGovernmentHealthMatrix(
    data
) {

    const container =
        document.getElementById(
            "governmentHealthMatrix"
        );

    if (!container) return;


    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};


    const sensors = [

        [
            "HX711 Load Cell",
            "Operational",
            "OK"
        ],

        [
            "MPU6050",
            tilt.status === "TILTED"
                ? "Tilt detected"
                : "Normal",
            tilt.status === "TILTED"
                ? "ALERT"
                : "OK"
        ],

        [
            "QMC5883L",
            magnet.status === "DETECTED"
                ? "Magnetic anomaly"
                : "Normal",
            magnet.status === "DETECTED"
                ? "ALERT"
                : "OK"
        ],

        [
            "LDR / Display Filter",
            ldr.ml_filter ||
                ldr.status ||
                "NORMAL",
            ldr.status === "TAMPER"
                ? "ALERT"
                : "OK"
        ],

        [
            "Voltage Sensor",
            number(
                voltage.value,
                0
            ).toFixed(2) +
            " V",
            voltage.status === "UNSTABLE"
                ? "ALERT"
                : "OK"
        ],

        [
            "Security Seal",
            seal.status ||
                "SECURE",
            seal.status === "TRIPPED"
                ? "ALERT"
                : "OK"
        ]

    ];


    container.innerHTML =
        sensors
            .map(
                sensor =>
                    `
                    <div class="health-row">

                        <span>
                            ${escapeHTML(
                                sensor[0]
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                sensor[1]
                            )}
                        </span>

                        <strong
                            class="${
                                sensor[2] === "OK"
                                    ? "status-table-good"
                                    : "status-table-bad"
                            }"
                        >
                            ${sensor[2]}
                        </strong>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

    const max =
        Math.max(
            1,
            tamperCounts.tilt,
            tamperCounts.magnet,
            tamperCounts.ldr,
            tamperCounts.voltage,
            tamperCounts.seal
        );


    setText(
        "analyticsTiltEvents",
        tamperCounts.tilt
    );

    setText(
        "analyticsMagEvents",
        tamperCounts.magnet
    );

    setText(
        "analyticsLdrEvents",
        tamperCounts.ldr
    );

    setText(
        "analyticsVoltageEvents",
        tamperCounts.voltage
    );

    setText(
        "analyticsSealEvents",
        tamperCounts.seal
    );


    const bars =
        document.getElementById(
            "eventBars"
        );


    if (bars) {

        const events = [

            [
                "Tilt",
                tamperCounts.tilt
            ],

            [
                "Magnet",
                tamperCounts.magnet
            ],

            [
                "Display",
                tamperCounts.ldr
            ],

            [
                "Voltage",
                tamperCounts.voltage
            ],

            [
                "Seal",
                tamperCounts.seal
            ]

        ];


        bars.innerHTML =
            events
                .map(
                    event =>
                        `
                        <div
                            class="event-bar-row"
                        >

                            <span>
                                ${event[0]}
                            </span>

                            <div
                                class="event-bar-track"
                            >
                                <div
                                    class="event-bar-fill"
                                    style="
                                        width:${
                                            (
                                                event[1] /
                                                max
                                            ) *
                                            100
                                        }%
                                    "
                                ></div>
                            </div>

                            <strong>
                                ${event[1]}
                            </strong>

                        </div>
                        `
                )
                .join("");
    }


    renderSensorHealthBars();
}


/* =========================================================
   SENSOR HEALTH BARS
========================================================= */

function renderSensorHealthBars() {

    const container =
        document.getElementById(
            "analyticsSensorHealth"
        );

    if (!container) return;


    const data =
        latestData || {};

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};


    const sensors = [

        [
            "Load Cell",
            true
        ],

        [
            "Tilt",
            tilt.status !== "TILTED"
        ],

        [
            "Magnetic",
            magnet.status !== "DETECTED"
        ],

        [
            "LDR",
            !(
                ldr.status === "TAMPER"
            )
        ],

        [
            "Voltage",
            voltage.status !== "UNSTABLE"
        ],

        [
            "Security Seal",
            seal.status !== "TRIPPED"
        ]

    ];


    container.innerHTML =
        sensors
            .map(
                sensor =>
                    `
                    <div
                        class="sensor-health-row"
                    >

                        <span>
                            ${sensor[0]}
                        </span>

                        <div
                            class="sensor-health-track"
                        >

                            <div
                                class="sensor-health-fill"
                                style="
                                    width:${
                                        sensor[1]
                                            ? 100
                                            : 25
                                    }%
                                "
                            ></div>

                        </div>

                        <strong>
                            ${
                                sensor[1]
                                    ? "OK"
                                    : "ALERT"
                            }
                        </strong>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   COMPLAINT SUBMISSION
========================================================= */

function submitComplaint(
    event
) {

    event.preventDefault();


    const category =
        document.getElementById(
            "complaintCategory"
        ).value;


    const description =
        document.getElementById(
            "complaintDescription"
        ).value.trim();


    if (
        !category ||
        !description
    ) {

        showToast(
            "Please complete the complaint.",
            "!"
        );

        return;
    }


    const complaint = {

        id:
            "CMP-" +
            String(
                complaints.length + 1
            ).padStart(
                4,
                "0"
            ),

        machine:
            currentMachine,

        category,

        description,

        date:
            new Date()
                .toLocaleDateString(),

        time:
            formatTime(
                new Date()
            ),

        status:
            "Pending",

        response:
            ""

    };


    complaints.unshift(
        complaint
    );


    localStorage.setItem(
        "mjr_complaints",
        JSON.stringify(
            complaints
        )
    );


    document.getElementById(
        "complaintCategory"
    ).value = "";


    document.getElementById(
        "complaintDescription"
    ).value = "";


    renderConsumerComplaints();

    renderGovernmentComplaints();


    addAudit(
        "Consumer complaint submitted",
        "Consumer",
        "SUCCESS"
    );


    showToast(
        "Complaint submitted successfully.",
        "✓"
    );
}


/* =========================================================
   CONSUMER COMPLAINTS
========================================================= */

function renderConsumerComplaints() {

    const container =
        document.getElementById(
            "consumerComplaintList"
        );

    if (!container) return;


    const machineComplaints =
        complaints.filter(
            complaint =>
                complaint.machine ===
                currentMachine
        );


    if (!machineComplaints.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>📝</div>
                <h2>No complaints</h2>
                <p>You have not submitted any complaints.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        machineComplaints
            .map(
                complaint =>
                    `
                    <div class="complaint-item">

                        <div class="complaint-item-header">

                            <span class="complaint-id">
                                ${escapeHTML(
                                    complaint.id
                                )}
                            </span>

                            <span class="complaint-status">
                                ${escapeHTML(
                                    complaint.status
                                )}
                            </span>

                        </div>

                        <h4>
                            ${escapeHTML(
                                complaint.category
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                complaint.description
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                complaint.date
                            )}
                            ·
                            ${escapeHTML(
                                complaint.time
                            )}
                        </p>

                        ${
                            complaint.response
                                ? `
                                <p>
                                    <strong>
                                        Official response:
                                    </strong>
                                    ${escapeHTML(
                                        complaint.response
                                    )}
                                </p>
                                `
                                : ""
                        }

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   GOVERNMENT COMPLAINTS
========================================================= */

function renderGovernmentComplaints() {

    const container =
        document.getElementById(
            "governmentComplaintList"
        );

    if (!container) return;


    if (!complaints.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>✓</div>
                <h2>No complaints</h2>
                <p>Consumer complaints will appear here.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        complaints
            .map(
                (complaint, index) =>
                    `
                    <div class="complaint-item">

                        <div class="complaint-item-header">

                            <span class="complaint-id">
                                ${escapeHTML(
                                    complaint.id
                                )}
                            </span>

                            <span class="complaint-status">
                                ${escapeHTML(
                                    complaint.status
                                )}
                            </span>

                        </div>

                        <h4>
                            ${escapeHTML(
                                complaint.category
                            )}
                        </h4>

                        <p>
                            <strong>
                                Machine:
                            </strong>
                            ${escapeHTML(
                                complaint.machine
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                complaint.description
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                complaint.date
                            )}
                            ·
                            ${escapeHTML(
                                complaint.time
                            )}
                        </p>


                        <div class="alert-actions">

                            <button
                                onclick="resolveComplaint(${index})"
                            >
                                ${
                                    complaint.status === "Resolved"
                                        ? "RESOLVED"
                                        : "MARK RESOLVED"
                                }
                            </button>

                            <button
                                onclick="respondToComplaint(${index})"
                            >
                                RESPOND
                            </button>

                        </div>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   RESOLVE COMPLAINT
========================================================= */

function resolveComplaint(
    index
) {

    if (
        !complaints[index]
    ) return;


    complaints[index]
        .status = "Resolved";


    localStorage.setItem(
        "mjr_complaints",
        JSON.stringify(
            complaints
        )
    );


    renderGovernmentComplaints();

    renderConsumerComplaints();


    addAudit(
        "Complaint resolved",
        "Government",
        "SUCCESS"
    );


    showToast(
        "Complaint resolved.",
        "✓"
    );
}


/* =========================================================
   RESPOND TO COMPLAINT
========================================================= */

function respondToComplaint(
    index
) {

    if (
        !complaints[index]
    ) return;


    const response =
        prompt(
            "Enter official response:"
        );


    if (
        response === null ||
        !response.trim()
    ) return;


    complaints[index]
        .response =
        response.trim();


    complaints[index]
        .status =
        "Responded";


    localStorage.setItem(
        "mjr_complaints",
        JSON.stringify(
            complaints
        )
    );


    renderGovernmentComplaints();

    renderConsumerComplaints();


    addAudit(
        "Official complaint response added",
        "Government",
        "SUCCESS"
    );


    showToast(
        "Response added.",
        "✓"
    );
}


/* =========================================================
   NEWS
========================================================= */

function publishNews(
    event
) {

    event.preventDefault();


    const title =
        document.getElementById(
            "newsTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "newsCategory"
        ).value;


    const priority =
        document.getElementById(
            "newsPriority"
        ).value;


    const description =
        document.getElementById(
            "newsDescription"
        ).value.trim();


    if (
        !title ||
        !category ||
        !description
    ) {

        showToast(
            "Complete all notice fields.",
            "!"
        );

        return;
    }


    const item = {

        id:
            "NEWS-" +
            String(
                newsItems.length + 1
            ).padStart(
                3,
                "0"
            ),

        title,

        category,

        priority,

        description,

        date:
            new Date()
                .toLocaleDateString(),

        time:
            formatTime(
                new Date()
            )

    };


    newsItems.unshift(
        item
    );


    localStorage.setItem(
        "mjr_news",
        JSON.stringify(
            newsItems
        )
    );


    document.getElementById(
        "newsTitle"
    ).value = "";

    document.getElementById(
        "newsCategory"
    ).value = "";

    document.getElementById(
        "newsPriority"
    ).value = "Normal";

    document.getElementById(
        "newsDescription"
    ).value = "";


    renderNews();

    renderGovernmentNews();


    addAudit(
        "Official notice published",
        "Government",
        "SUCCESS"
    );


    showToast(
        "Notice published.",
        "✓"
    );
}


/* =========================================================
   CONSUMER NEWS
========================================================= */

function renderNews() {

    const container =
        document.getElementById(
            "consumerNewsList"
        );

    if (!container) return;


    if (!newsItems.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>📰</div>
                <h2>No latest notices</h2>
                <p>Official notices published by the government will appear here.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        newsItems
            .map(
                item =>
                    `
                    <article class="news-card">

                        <div class="news-card-top">

                            <span class="news-category">
                                ${escapeHTML(
                                    item.category
                                )}
                            </span>

                            <span class="news-priority">
                                ${escapeHTML(
                                    item.priority
                                )}
                            </span>

                        </div>

                        <h3>
                            ${escapeHTML(
                                item.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                item.description
                            )}
                        </p>

                        <span class="news-date">
                            Published:
                            ${escapeHTML(
                                item.date
                            )}
                            ·
                            ${escapeHTML(
                                item.time
                            )}
                        </span>

                    </article>
                    `
            )
            .join("");
}


/* =========================================================
   GOVERNMENT NEWS
========================================================= */

function renderGovernmentNews() {

    const container =
        document.getElementById(
            "governmentNewsList"
        );

    if (!container) return;


    if (!newsItems.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <div>📰</div>
                <h2>No notices</h2>
                <p>Published notices will appear here.</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        newsItems
            .map(
                (item, index) =>
                    `
                    <div class="complaint-item">

                        <div class="complaint-item-header">

                            <span class="complaint-id">
                                ${escapeHTML(
                                    item.id
                                )}
                            </span>

                            <span class="complaint-status">
                                ${escapeHTML(
                                    item.priority
                                )}
                            </span>

                        </div>

                        <h4>
                            ${escapeHTML(
                                item.title
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                item.description
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                item.date
                            )}
                        </p>

                        <button
                            class="text-button"
                            onclick="deleteNews(${index})"
                        >
                            Delete notice
                        </button>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   DELETE NEWS
========================================================= */

function deleteNews(
    index
) {

    if (
        !newsItems[index]
    ) return;


    if (
        !confirm(
            "Delete this notice?"
        )
    ) return;


    newsItems.splice(
        index,
        1
    );


    localStorage.setItem(
        "mjr_news",
        JSON.stringify(
            newsItems
        )
    );


    renderNews();

    renderGovernmentNews();


    addAudit(
        "Official notice deleted",
        "Government",
        "SUCCESS"
    );
}


/* =========================================================
   LOCATION
========================================================= */

function getLocation() {

    const status =
        document.getElementById(
            "locationStatus"
        );

    const text =
        document.getElementById(
            "locationText"
        );

    const coordinates =
        document.getElementById(
            "locationCoordinates"
        );


    if (
        !navigator.geolocation
    ) {

        status.textContent =
            "Geolocation unavailable";

        text.textContent =
            "This browser does not support location services.";

        return;
    }


    status.textContent =
        "Requesting location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            status.textContent =
                "Location acquired";

            text.textContent =
                "Current authorized browser/device location:";


            coordinates.textContent =
                "Latitude: " +
                latitude.toFixed(6) +
                " | Longitude: " +
                longitude.toFixed(6);


            addAudit(
                "Machine location viewed",
                "Government",
                "SUCCESS"
            );
        },

        error => {

            status.textContent =
                "Location unavailable";

            text.textContent =
                "Location permission was denied or the device could not provide a position.";

            coordinates.textContent =
                "";

        },

        {
            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                30000
        }
    );
}


/* =========================================================
   AUDIT LOG
========================================================= */

function addAudit(
    action,
    portal,
    status
) {

    const entry = {

        time:
            new Date()
                .toLocaleString(),

        action,

        portal,

        status

    };


    auditLogs.unshift(
        entry
    );


    auditLogs =
        auditLogs.slice(
            0,
            200
        );


    localStorage.setItem(
        "mjr_audit",
        JSON.stringify(
            auditLogs
        )
    );


    renderAudit();
}


function renderAudit() {

    const table =
        document.getElementById(
            "auditTable"
        );

    if (!table) return;


    if (!auditLogs.length) {

        table.innerHTML =
            `
            <tr>
                <td
                    colspan="4"
                    class="empty-table"
                >
                    No audit actions yet.
                </td>
            </tr>
            `;

        return;
    }


    table.innerHTML =
        auditLogs
            .slice(0, 100)
            .map(
                log =>
                    `
                    <tr>

                        <td>
                            ${escapeHTML(
                                log.time
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                log.action
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                log.portal
                            )}
                        </td>

                        <td
                            class="status-table-good"
                        >
                            ${escapeHTML(
                                log.status
                            )}
                        </td>

                    </tr>
                    `
            )
            .join("");
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAllTables() {

    renderWeightHistory();

    renderTrustEvents();

    renderConsumerTamper();

    renderGovernmentTamper();

    renderGovernmentAlerts();

    renderIncidents();

    renderConsumerComplaints();

    renderGovernmentComplaints();

    renderNews();

    renderGovernmentNews();

    renderAudit();

    renderGovernmentMachine();
}


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value;
}


function number(
    value,
    fallback = 0
) {

    const parsed =
        Number(value);

    return Number.isFinite(
        parsed
    )
        ? parsed
        : fallback;
}


function round(
    value,
    decimals = 2
) {

    return Number(
        number(value, 0)
            .toFixed(decimals)
    );
}


function average(
    values
) {

    if (!values.length) return 0;

    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        values.length
    );
}


function calculateTiltMagnitude(
    x,
    y
) {

    return Math.sqrt(
        x * x +
        y * y
    );
}


function formatTime(
    date
) {

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


function formatGraphValue(
    value,
    mode
) {

    if (
        mode === "degree"
    ) {

        return value.toFixed(1) + "°";
    }

    if (
        mode === "voltage"
    ) {

        return value.toFixed(2);
    }

    if (
        mode === "score"
    ) {

        return value.toFixed(0);
    }

    if (
        mode === "kg"
    ) {

        return value.toFixed(2);
    }

    if (
        mode === "mag"
    ) {

        return Math.round(value);
    }

    if (
        mode === "ldr"
    ) {

        return Math.round(value);
    }

    return value.toFixed(1);
}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   STATUS COLOR
========================================================= */

function updateStatusColor(
    id,
    color
) {

    const element =
        document.getElementById(id);

    if (!element) return;


    if (color === "red") {

        element.style.color =
            "var(--red)";

    } else {

        element.style.color =
            "var(--green)";
    }
}


/* =========================================================
   GET HEALTH
========================================================= */

function getHealthFromData(
    data
) {

    const tilt =
        data.tilt || {};

    const magnet =
        data.magnet || {};

    const ldr =
        data.ldr || {};

    const voltage =
        data.voltage || {};

    const seal =
        data.seal || {};


    if (
        tilt.status === "TILTED" ||
        magnet.status === "DETECTED" ||
        ldr.status === "TAMPER" ||
        voltage.status === "UNSTABLE" ||
        seal.status === "TRIPPED"
    ) {

        return "ATTENTION";
    }


    return "GOOD";
}


/* =========================================================
   LOCAL STORAGE / MACHINE RESET HELP
========================================================= */

function clearLocalHistory() {

    if (
        !confirm(
            "Clear local website history?"
        )
    ) return;


    weightHistory = [];

    tamperHistory = [];

    trustEvents = [];

    complaints = [];

    auditLogs = [];


    localStorage.removeItem(
        "mjr_weight_history"
    );

    localStorage.removeItem(
        "mjr_tamper_history"
    );

    localStorage.removeItem(
        "mjr_trust_events"
    );

    localStorage.removeItem(
        "mjr_complaints"
    );

    localStorage.removeItem(
        "mjr_audit"
    );


    renderAllTables();

    showToast(
        "Local history cleared.",
        "✓"
    );
}


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        redrawAllCharts();

    }
);
