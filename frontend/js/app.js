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
        🤖 Thinking...
    </div>
    `;

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

            

        chat.innerHTML += `
    <div class="bot-message">
        ${data.answer
    .replace(/\*\*/g,"")
    .replace(/\n/g,"<br>")
}

        <br><br>

        <small>
            📄 Sources:
            <br>
            ${data.sources.join("<br>")}
        </small>
    </div>
`;

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

    const sections = [

        "assistantSection",
        "documentsSection",
        "analyticsSection",
        "settingsSection"

    ];

    sections.forEach(id => {

        const section =
            document.getElementById(id);

        section.classList.remove(
            "active-section"
        );

        section.style.display = "none";

    });

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
document.getElementById(
    "settingsSection"
);

section.style.display = "flex";

setTimeout(() => {

    section.classList.add(
        "active-section"
    );

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


