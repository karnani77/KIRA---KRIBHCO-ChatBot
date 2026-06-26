let questionCount =
    parseInt(
        localStorage.getItem("questionCount")
)    || 0;

let analytics =
JSON.parse(
    localStorage.getItem("analytics")

) || {

    khms:0,
    kres:0,
    eseva:0,
    procurement:0,
    other:0
};

let questionHistory =
JSON.parse(
    localStorage.getItem("questionHistory")
) || [];

function quickAsk(question){

    document.getElementById(
        "questionInput"
    ).value = question;

    sendMessage();

}
async function sendMessage(){

    const input =
        document.getElementById("questionInput");

    const chat =
        document.getElementById("chatMessages");

    const question = input.value;
    questionHistory.unshift(question);

if(questionHistory.length > 5){
    questionHistory.pop();
}

localStorage.setItem(
    "questionHistory",
    JSON.stringify(questionHistory)
);
    const q = question.toLowerCase();

    if(q.includes("khms")){

    analytics.khms++;

}
else if(
    q.includes("kres")
    ||
    q.includes("kre s")
){

    analytics.kres++;

}
else if(
    q.includes("e-seva")
    ||
    q.includes("eseva")
){

    analytics.eseva++;

}
else if(
    q.includes("procurement")
    ||
    q.includes("vendor")
    ||
    q.includes("laptop")
    ||
    q.includes("pc")
){

    analytics.procurement++;

}
else{

    analytics.other++;

}

localStorage.setItem(
    "analytics",
    JSON.stringify(analytics)
);
updateDashboard();

if(analyticsChart){

    analyticsChart.data.datasets[0].data = [
        analytics.khms,
        analytics.kres,
        analytics.eseva,
        analytics.procurement
    ];

    analyticsChart.update('active');

}

if(!question) return;

questionCount++;
localStorage.setItem(
    "questionCount",
    questionCount
);

document.getElementById("questionCount").innerText =
    questionCount;

const analyticsCounter =
    document.getElementById("analyticsQuestionCount");

if (analyticsCounter) {
    analyticsCounter.innerText = questionCount;
}

    chat.innerHTML += `
        <div class="user-message">
            ${question}
        </div>
    `;
    chat.scrollTop = chat.scrollHeight;

    input.value = "";

    try {

    chat.innerHTML += `
<div class="bot-message" id="thinking">
    🔍 Searching KRIBHCO knowledge base...
</div>
`;

const loadingMessages = [
    "🔍 Searching KRIBHCO knowledge base...",
    "📄 Reading relevant documents...",
    "🤖 KIRA is generating your response..."
];

let loadingIndex = 0;

const loadingAnimation = setInterval(() => {

    const thinking =
        document.getElementById("thinking");

    if (!thinking) {
        clearInterval(loadingAnimation);
        return;
    }

    loadingIndex =
        (loadingIndex + 1) % loadingMessages.length;

    thinking.innerHTML =
        loadingMessages[loadingIndex];

}, 1200);

    chat.scrollTop = chat.scrollHeight;

    chat.scrollTo({
        top: chat.scrollHeight,
        behavior: "smooth"
    });

    const response =
        await fetch("http://localhost:8000/chat",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                question:question
            })
        });

    const data =
        await response.json();

    document.getElementById("thinking")?.remove();

            

    const botMessage = document.createElement("div");
botMessage.className = "bot-message";

chat.appendChild(botMessage);

let fullAnswer = data.answer.replace(/\*\*/g, "");

let mainAnswer = fullAnswer;

let followUps = [];

if(fullAnswer.includes("Follow-up Questions:")){

    const parts =
        fullAnswer.split("Follow-up Questions:");

    mainAnswer = parts[0].trim();

    let followSection =
        parts[1];

    if(followSection.includes("Reply:")){

        followSection =
            followSection.split("Reply:")[0];

    }

    const questions =
        followSection
            .split("\n")
            .filter(line =>
                line.trim().startsWith("•")
            );

    followUps =
        questions.map(q =>
            q.replace("•","").trim()
        );

}

typeWriter(
    botMessage,
    mainAnswer,
    () => {

        let confidence = "";

        if(data.answer.includes("I could not find")){

            confidence =
            `<div class="confidence low">
                🔴 Information Not Found
            </div>`;

        }
        else if(data.sources.length){

            confidence =
            `<div class="confidence high">
                🟢 High Confidence
            </div>`;

        }
        else{

            confidence =
            `<div class="confidence medium">
                🟡 Partial Match
            </div>`;

        }

        botMessage.insertAdjacentHTML(
    "afterbegin",
    confidence + "<br><br>"

);
        if(followUps.length){

    const title =
        document.createElement("div");

    title.innerHTML =
        "<br><b>📌 Suggested Questions</b><br><br>";

    botMessage.appendChild(title);

    followUps.forEach(question => {

        const btn =
            document.createElement("button");

        btn.className =
            "follow-up-btn";

        btn.innerText =
            question;

        btn.onclick = () => {

            quickAsk(question);

        };

        botMessage.appendChild(btn);

    });

}
        if(data.sources.length){

            const sourceDiv =
                document.createElement("small");

            sourceDiv.innerHTML =
                "<br><br>📄 Sources:<br>" +
                data.sources.join("<br>");

            botMessage.appendChild(sourceDiv);

        }

    }

);

chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
});
chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
});

    }
    catch(err){

        chat.innerHTML += `
            <div class="bot-message">
                Backend not connected.
            </div>
        `;
    }

    chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
});
}

function removeActive(){

    document
    .querySelectorAll(".nav-menu li")
    .forEach(item => {
        item.classList.remove("active");
    });

}

function hideAllSections(){

    document.getElementById(
        "dashboardSection"
    ).style.display = "none";

    document.getElementById(
        "assistantSection"
    ).style.display = "none";

    document.getElementById(
        "documentsSection"
    ).style.display = "none";

    document.getElementById(
        "analyticsSection"
    ).style.display = "none";

    document.getElementById(
        "settingsSection"
    ).style.display = "none";

}

document
.getElementById("assistantBtn")
.addEventListener("click", function(){

    removeActive();
    this.classList.add("active");

    hideAllSections();

    const section =
document.getElementById(
    "assistantSection"
);

section.style.display = "flex";

setTimeout(() => {

    section.classList.add(
        "active-section"
    );

}, 10);

    setTimeout(() => {

        const chat =
            document.getElementById("chatMessages");

        chat.scrollTop =
            chat.scrollHeight;

    }, 100);

});

document
.getElementById("documentsBtn")
.addEventListener("click", function(){

    removeActive();
    this.classList.add("active");

    hideAllSections();

    const section =
document.getElementById(
    "documentsSection"
);

section.style.display = "flex";

setTimeout(() => {

    section.classList.add(
        "active-section"
    );

}, 10);

});

document
.getElementById("analyticsBtn")
.addEventListener("click", function(){

    removeActive();
    this.classList.add("active");

    hideAllSections();

    const section =
document.getElementById(
    "analyticsSection"
);

section.style.display = "flex";

setTimeout(() => {

    section.classList.add(
        "active-section"
    );

}, 10);
});

document
.getElementById("settingsBtn")
.addEventListener("click", function(){

    removeActive();
    this.classList.add("active");

    hideAllSections();

    const section =
        document.getElementById("settingsSection");

    section.style.display = "flex";

    setTimeout(() => {
        section.classList.add("active-section");
    }, 10);

});

document
.getElementById("dashboardBtn")
.addEventListener("click", function(){

    removeActive();
    this.classList.add("active");

    hideAllSections();

    const section =
        document.getElementById("dashboardSection");

    section.style.display = "block";

    setTimeout(() => {
        section.classList.add("active-section");
    }, 10);

});

document
.getElementById("questionInput")
.addEventListener("keypress", function(event){

    if(event.key === "Enter"){
        sendMessage();
    }

});

document.getElementById(
    "questionCount"
).innerText = questionCount;

const ctx =
document.getElementById(
    "analyticsChart"
);

if(ctx){

    analyticsChart = new Chart(ctx, {

        type: "pie",

        data: {
            labels:[
                "KHMS",
                "KReS",
                "e-Seva",
                "Procurement"
            ],
            datasets:[{
                data:[
                    analytics.khms,
                    analytics.kres,
                    analytics.eseva,
                    analytics.procurement
                ]
            }]
        },

        options:{
    responsive:true,
    maintainAspectRatio:false,

    animation:{
        duration:1500,
        easing:'easeOutBounce'
    }
}

    });

}

function updateDashboard(){

    const recentList =
        document.getElementById("recentQuestions");

    if(recentList){

        recentList.innerHTML = "";

        questionHistory.forEach(question => {

            recentList.innerHTML += `
                <li>${question}</li>
            `;

        });

    }

    const topTopics =
        document.getElementById("topTopics");

    if(topTopics){

        topTopics.innerHTML = `
            <div class="topic-row">
                <span class="topic-name">KHMS</span>
                <span class="topic-count">${analytics.khms}</span>
            </div>

            <div class="topic-row">
                <span class="topic-name">KReS</span>
                <span class="topic-count">${analytics.kres}</span>
            </div>

            <div class="topic-row">
                <span class="topic-name">e-Seva</span>
                <span class="topic-count">${analytics.eseva}</span>
            </div>

            <div class="topic-row">
                <span class="topic-name">Procurement</span>
                <span class="topic-count">${analytics.procurement}</span>
            </div>
        `;
    }
}

updateDashboard();

function typeWriter(element, text, callback) {

    let index = 0;

    function type() {

        if (index < text.length) {

            if (text[index] === "\n") {
                element.innerHTML += "<br>";
            } else {
                element.innerHTML += text[index];
            }

            index++;

            const chat =
                document.getElementById("chatMessages");

            chat.scrollTop = chat.scrollHeight;

            setTimeout(type, 10);

        } else {

            if (callback) {
                callback();
            }

        }

    }

    type();

}
