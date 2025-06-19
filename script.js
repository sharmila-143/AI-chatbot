let prompt = document.querySelector("#prompt");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let imageinput = imagebtn.querySelector("input[type='file']");

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAhQayu3qhccQcLjbHYGnEqBi0Dc3Zczg8";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

let isWaitingForResponse = false;

prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && prompt.value.trim() !== "" && !isWaitingForResponse) {
        isWaitingForResponse = true;
        handlechatResponse(prompt.value.trim());
    }
});

async function generateResponse(aiChatBox, user, file, message) {
    let RequestOption = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: user.file.data
                        ? [
                            { text: message },
                            {
                                inline_data: {
                                    mime_type: user.file.mime_type,
                                    data: user.file.data
                                }
                            }
                        ]
                        : [{ text: message }]
                }
            ]
        })
    };

    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        aiChatBox.querySelector(".ai-chat-area").innerHTML = aiResponse
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
        console.log(aiResponse);
    } catch (error) {
        console.log(error);
        aiChatBox.querySelector(".ai-chat-area").innerHTML = "Error fetching response.";
    } finally {
        isWaitingForResponse = false;
        prompt.disabled = false;
        chatContainer.scrollTop = chatContainer.scrollHeight;

        user.file = { mime_type: null, data: null };
        if (imageinput) {
            imageinput.value = "";
        }
    }
}

function handlechatResponse(usermessage) {
    user.message = usermessage;

    let imageHTML = "";
    if (user.file.data) {
        imageHTML = `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="choosiimg"/>`;
    }

    let html = `
        <img src="user.png" alt="" id="userImage" width="50">
        <div class="user-chat-area">
            ${user.message}
            ${imageHTML}
        </div>`;

    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Reset image data so it won't appear again accidentally
    // Note: Let generateResponse handle the reset in finally block

    setTimeout(() => {
        let html = `
            <img src="robot.png" alt="" id="aiImage" width="50">
            <div class="ai-chat-area">
                <img src="dots.png" alt="" class="load" width="50px">
            </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);

        generateResponse(aiChatBox, user, user.file, user.message);
    }, 100);
}

document.getElementById("submit").addEventListener("click", async () => {
    const promptText = prompt.value.trim();
    if (!promptText) {
        return;
    }
    isWaitingForResponse = true;
    handlechatResponse(promptText);
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        }
    }
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imageinput.click();
});

// Focus prompt on any key press
document.addEventListener("keydown", () => {
    prompt.focus();
});
