
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatMessages = document.getElementById("chat-messages");
const newChatButton = document.getElementById("new-chat");
const quickQuestions = document.querySelectorAll("[data-question]");

let conversationHistory = [];
let isSending = false;

function addMessage(text, role) {
    const wrapper = document.createElement("div");
    wrapper.className =
        role === "user"
            ? "message user-message"
            : "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "Y" : "S";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // Use textContent rather than innerHTML to prevent HTML injection.
    bubble.textContent = text;

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = role === "user" ? "You" : "AI Assistant";

    content.appendChild(bubble);
    content.appendChild(time);
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return wrapper;
}

function setSendingState(sending) {
    isSending = sending;
    sendButton.disabled = sending;
    messageInput.disabled = sending;
    sendButton.querySelector("span").textContent =
        sending ? "Sending..." : "Send";
}

async function sendMessage(text) {
    const message = text.trim();

    if (!message || isSending) return;

    addMessage(message, "user");

    const historyForRequest = [...conversationHistory];

    messageInput.value = "";
    messageInput.style.height = "auto";
    setSendingState(true);

    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.textContent = "Assistant is typing...";
    typing.setAttribute("role", "status");

    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: historyForRequest
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to get a response."
            );
        }

        if (typeof data.reply !== "string" || !data.reply.trim()) {
            throw new Error("The assistant returned an empty response.");
        }

        addMessage(data.reply, "assistant");

        // Keep the successful exchange for future context.
        conversationHistory.push(
            { role: "user", text: message },
            { role: "model", text: data.reply }
        );

        // Retain at most 12 messages in the browser history.
        conversationHistory = conversationHistory.slice(-12);

    } catch (error) {
        console.error("Chat request failed:", error);

        addMessage(
            error.message ||
                "Sorry, something went wrong. Please try again.",
            "assistant"
        );
    } finally {
        typing.remove();
        setSendingState(false);
        messageInput.focus();
    }
}

chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(messageInput.value);
});

messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (chatForm.requestSubmit) {
            chatForm.requestSubmit();
        }
    }
});

quickQuestions.forEach((button) => {
    button.addEventListener("click", () => {
        sendMessage(button.dataset.question);
    });
});

newChatButton.addEventListener("click", () => {
    if (isSending) return;

    conversationHistory = [];
    chatMessages.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "S";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent =
        "Hello! Welcome to customer support. How can I help you today?";

    const label = document.createElement("span");
    label.className = "message-time";
    label.textContent = "AI Assistant";

    content.append(bubble, label);
    welcome.append(avatar, content);
    chatMessages.appendChild(welcome);

    messageInput.value = "";
    messageInput.focus();
});
