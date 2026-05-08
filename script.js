// script.js - 修复版本
const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_NAME = "qwen3.6-plus";

// 保存对话历史
let messages = [
    {
        role: "system",
        content: "你是一个专业的求职材料优化助手。请根据用户提供的个人经历、目标岗位和修改要求，生成结构清晰、表达自然、适合投递的简历亮点、岗位匹配分析、求职信或面试自我介绍。用户后续提出修改要求时，必须结合前文继续优化。"
    }
];

let lastReply = "";

// 获取页面元素
const apiKeyInput = document.getElementById("apiKey");
const targetJobInput = document.getElementById("targetJob");
const outputTypeInput = document.getElementById("outputType");
const experienceInput = document.getElementById("experience");
const adviceInput = document.getElementById("advice");
const chatBox = document.getElementById("chatBox");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const exampleBtn = document.getElementById("exampleBtn");
const copyBtn = document.getElementById("copyBtn");

// 事件绑定
generateBtn.addEventListener("click", generateContent);
clearBtn.addEventListener("click", clearChat);
exampleBtn.addEventListener("click", fillExample);
copyBtn.addEventListener("click", copyLastReply);

// 构建用户消息
function buildUserMessage() {
    const targetJob = targetJobInput.value.trim();
    const outputType = outputTypeInput.value;
    const experience = experienceInput.value.trim();
    const advice = adviceInput.value.trim();

    return "请完成一次求职材料生成或修改任务：\n" +
           "【目标岗位】\n" + (targetJob || "未填写，请根据个人经历推断合适表达") + "\n" +
           "【生成类型】\n" + outputType + "\n" +
           "【个人经历】\n" + (experience || "本轮未补充新的个人经历，请主要依据前文继续修改。") + "\n" +
           "【本轮修改要求】\n" + (advice || "请直接生成一版完整、清晰、适合投递的内容。") + "\n" +
           "请注意：输出内容要自然、真实、适合求职场景。";
}

// 生成内容
async function generateContent() {
    errorBox.textContent = "";

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showError("请先输入阿里云百炼 API Key。");
        return;
    }

    if (!experienceInput.value.trim() && !adviceInput.value.trim() && messages.length === 1) {
        showError("第一次生成建议先填写个人经历。");
        return;
    }

    const userMessage = buildUserMessage();
    messages.push({ role: "user", content: userMessage });
    appendMessage("user", userMessage);

    setLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.7
            })
        });

        const rawText = await response.text();
        if (!response.ok) {
            throw new Error("接口请求失败，状态码：" + response.status + " " + rawText);
        }

        const data = JSON.parse(rawText);
        const reply = data?.choices?.[0]?.message?.content || "";

        if (!reply) {
            throw new Error("模型没有返回有效内容，请稍后重试。");
        }

        lastReply = reply;
        messages.push({ role: "assistant", content: reply });
        appendMessage("assistant", reply);
        adviceInput.value = "";
    } catch (error) {
        showError("生成失败：" + error.message);
    } finally {
        setLoading(false);
    }
}

// 填入示例
function fillExample() {
    targetJobInput.value = "跨境电商运营助理";
    outputTypeInput.value = "简历亮点优化";
    experienceInput.value = "本人学习过跨境电子商务、市场营销和数据分析课程，熟悉基础办公软件。曾参与校园网店运营实践，负责商品标题优化、图片整理、客户咨询回复和活动文案撰写。具备较强的沟通能力和执行能力，英语基础较好，能够阅读简单英文产品信息。";
    adviceInput.value = "请突出跨境电商岗位匹配度，语言正式一些，分点输出。";
}

// 清空对话
function clearChat() {
    messages = [
        {
            role: "system",
            content: "你是一个专业的求职材料优化助手。"
        }
    ];
    lastReply = "";
    chatBox.innerHTML = '<div class="empty">生成结果会显示在这里。你可以连续输入修改要求，让系统不断优化同一份求职材料。</div>';
    errorBox.textContent = "";
    adviceInput.value = "";
}

// 显示消息
function appendMessage(role, content) {
    const empty = chatBox.querySelector(".empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = role === "user" ? "message user-message" : "message ai-message";

    const roleLine = document.createElement("div");
    roleLine.className = "role";
    roleLine.textContent = role === "user" ? "用户输入" : "AI 回复";

    const text = document.createElement("div");
    text.textContent = content;

    item.appendChild(roleLine);
    item.appendChild(text);
    chatBox.appendChild(item);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 加载状态
function setLoading(isLoading) {
    loading.style.display = isLoading ? "block" : "none";
    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? "生成中..." : "生成 / 继续修改";
}

// 错误提示
function showError(message) {
    errorBox.textContent = message;
}

// 复制最后回复
async function copyLastReply() {
    if (!lastReply) {
        showError("当前还没有可复制的 AI 回复。");
        return;
    }
    try {
        await navigator.clipboard.writeText(lastReply);
        errorBox.textContent = "";
        alert("最新回复已复制。");
    } catch (error) {
        showError("复制失败，请手动选中结果复制。");
    }
}