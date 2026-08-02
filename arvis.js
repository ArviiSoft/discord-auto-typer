const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const generateMessage = require("./generator.js");
const { Client } = require("discord.js-selfbot-v13");

const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    clear: "\x1b[2J",
    cursorHome: "\x1b[H",
    hideCursor: "\x1b[?25l",
    showCursor: "\x1b[?25h",
};

const state = {
    startedAt: Date.now(),
    logs: [],
    lastLogs: [],
    totalAccounts: config.TOKENLER.length,
    loginAttemptsFinished: 0,
    activeAccounts: 0,
    invalidAccounts: 0,
    messagesSent: 0,
    manualPaused: false,
};

const commands = loadCommands();

function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function padAnsi(text, width) {
    const visibleLength = stripAnsi(text).length;
    return text + " ".repeat(Math.max(0, width - visibleLength));
}

function truncateText(text, width) {
    if (text.length <= width) return text;
    return `${text.slice(0, Math.max(0, width - 3))}...`;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function getMemoryUsage() {
    return `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`;
}

function getTime() {
    return new Date().toTimeString().slice(0, 8);
}

function getLevelTag(level) {
    if (level === "SUCCESS") return `${ANSI.green}[SUCCESS]${ANSI.reset}`;
    if (level === "ERROR") return `${ANSI.red}[ERROR]${ANSI.reset}`;
    if (level === "WARN") return `${ANSI.yellow}[WARN]${ANSI.reset}`;
    return `${ANSI.cyan}[INFO]${ANSI.reset}`;
}

function addLog(level, message) {
    state.logs.push({
        time: getTime(),
        level,
        message,
    });

    if (state.logs.length > 100) {
        state.logs.shift();
    }

    renderDashboard();
}

function addLastLog(level, message) {
    state.lastLogs.push({
        time: getTime(),
        level,
        message,
    });

    if (state.lastLogs.length > 30) {
        state.lastLogs.shift();
    }

    addLog(level, message);
}

function drawPanel(title, lines, width, height) {
    const innerWidth = width - 2;
    const titleText = ` ${title} `;
    const topLine =
        `${ANSI.cyan}╭${ANSI.reset}` +
        `${ANSI.bold}${titleText}${ANSI.reset}` +
        `${ANSI.cyan}${"─".repeat(Math.max(0, innerWidth - titleText.length))}╮${ANSI.reset}`;
    const bodyLines = lines.slice(-height);

    while (bodyLines.length < height) {
        bodyLines.push("");
    }

    const body = bodyLines.map((line) => {
        const visibleLine = truncateText(stripAnsi(line), innerWidth);
        const outputLine =
            stripAnsi(line).length > innerWidth
                ? visibleLine
                : line;

        return `${ANSI.cyan}│${ANSI.reset}${padAnsi(outputLine, innerWidth)}${ANSI.cyan}│${ANSI.reset}`;
    });

    return [
        topLine,
        ...body,
        `${ANSI.cyan}╰${"─".repeat(innerWidth)}╯${ANSI.reset}`,
    ].join("\n");
}

function renderLogLine(log, innerWidth) {
    const prefixLength = `${log.time} [${log.level}] `.length;
    const maxMessageLength = Math.max(0, innerWidth - prefixLength);
    const message = truncateText(log.message, maxMessageLength);

    return `${ANSI.gray}${log.time}${ANSI.reset} ${getLevelTag(log.level)} ${message}`;
}

function renderMetric(label, value, color, width) {
    const metric = `${ANSI.gray}${label.padEnd(15)}${ANSI.reset}${color}${value}${ANSI.reset}`;
    return padAnsi(metric, width);
}

function renderMetricRow(left, right, innerWidth) {
    const gap = "  ";
    const columnWidth = Math.floor((innerWidth - gap.length) / 2);
    const leftText = renderMetric(left.label, left.value, left.color, columnWidth);
    const rightText = renderMetric(right.label, right.value, right.color, columnWidth);

    return `${leftText}${gap}${rightText}`;
}

function renderChip(label, value, color) {
    return `${ANSI.gray}${label}:${ANSI.reset} ${color}${value}${ANSI.reset}`;
}

function getMessageMode() {
    if (config.generatorjs === true) return "Generator";
    if (config.onlyonemessage === true) return "Single";
    return "Disabled";
}

function getAccountStatus() {
    if (state.manualPaused) return "Stopped";
    if (state.activeAccounts > 0) return "Online";
    return "Waiting";
}

function getStatusColor(status) {
    if (status === "Online") return ANSI.green;
    if (status === "Waiting") return ANSI.yellow;
    return ANSI.red;
}

function renderDashboard() {
    const terminalWidth = Math.max(72, process.stdout.columns || 100);
    const width = Math.min(terminalWidth, 112);
    const innerWidth = width - 2;
    const logHeight = 10;
    const statsHeight = 4;
    const lastLogHeight = 5;
    const status = getAccountStatus();
    const invalidText =
        state.invalidAccounts > 0
            ? `${state.invalidAccounts} (Unknown)`
            : "0";
    const logLines = state.logs.map((log) => renderLogLine(log, innerWidth));
    const lastLogLines = state.lastLogs.map((log) => renderLogLine(log, innerWidth));
    const headerLines = [
        [
            renderChip("Status", status, getStatusColor(status)),
            renderChip("Accounts", `${state.activeAccounts}/${state.totalAccounts}`, ANSI.cyan),
            renderChip("Mode", getMessageMode(), ANSI.cyan),
            renderChip("Interval", formatDuration(config.MESAJ_GONDERIM_SURESI), ANSI.green),
        ].join("   "),
    ];
    const statsLines = [
        renderMetricRow(
            {
                label: "Messages",
                value: String(state.messagesSent),
                color: ANSI.cyan,
            },
            {
                label: "Uptime",
                value: formatDuration(Date.now() - state.startedAt),
                color: ANSI.green,
            },
            innerWidth,
        ),
        renderMetricRow(
            {
                label: "RAM",
                value: getMemoryUsage(),
                color: ANSI.cyan,
            },
            {
                label: "Invalid",
                value: invalidText,
                color: state.invalidAccounts > 0 ? ANSI.red : ANSI.green,
            },
            innerWidth,
        ),
        renderMetricRow(
            {
                label: "Status",
                value: status,
                color: getStatusColor(status),
            },
            {
                label: "Commands",
                value: String(commands.size),
                color: ANSI.cyan,
            },
            innerWidth,
        ),
        renderMetricRow(
            {
                label: "Mode",
                value: getMessageMode(),
                color: ANSI.cyan,
            },
            {
                label: "Admin",
                value: config.adminID ? "Set" : "Missing",
                color: config.adminID ? ANSI.green : ANSI.yellow,
            },
            innerWidth,
        ),
    ];

    process.stdout.write(
        `${ANSI.hideCursor}${ANSI.clear}${ANSI.cursorHome}` +
            drawPanel("Auto Typer Dashboard", headerLines, width, 1) +
            "\n" +
            drawPanel("Live Logs", logLines, width, logHeight) +
            "\n" +
            drawPanel("Statistics", statsLines, width, statsHeight) +
            "\n" +
            drawPanel("Last Logs", lastLogLines, width, lastLogHeight) +
            "\n",
    );
}

function loadCommands() {
    const loadedCommands = new Map();
    const commandsPath = path.join(__dirname, "Commands");

    if (!fs.existsSync(commandsPath)) {
        return loadedCommands;
    }

    for (const file of fs.readdirSync(commandsPath)) {
        if (!file.endsWith(".js")) continue;

        const command = require(path.join(commandsPath, file));

        if (!command?.name || typeof command.execute !== "function") {
            continue;
        }

        loadedCommands.set(command.name.toLowerCase(), command);

        for (const alias of command.aliases || []) {
            loadedCommands.set(alias.toLowerCase(), command);
        }
    }

    return loadedCommands;
}

function isPaused() {
    return state.manualPaused;
}

function getSingleMessage() {
    return config.message || config.messaege || "";
}

function getNextMessage() {
    if (config.generatorjs === true) {
        return generateMessage();
    }

    if (config.onlyonemessage === true) {
        return getSingleMessage();
    }

    return "";
}

async function sendChannelMessage(channel, content) {
    try {
        await channel.send({ content });
        state.messagesSent++;
        renderDashboard();
        return true;
    } catch {
        addLog("ERROR", "Message could not be sent.");
        return false;
    }
}

function finishLoginAttempt() {
    if (state.loginAttemptsFinished !== state.totalAccounts) return;

    addLog(
        "INFO",
        `${state.activeAccounts}/${state.totalAccounts} accounts successfully logged in.`,
    );
}

function resumeAccount(reason = "Account resumed.") {
    state.manualPaused = false;

    addLastLog("SUCCESS", reason);
}

function stopAccount(reason = "Account stopped.") {
    state.manualPaused = true;

    addLastLog("WARN", reason);
}

async function handleCommand(message) {
    const prefix = config.prefix || ".";

    if (!message.content.startsWith(prefix)) {
        return false;
    }

    const parts = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = parts.shift()?.toLowerCase();
    const command = commands.get(commandName);

    if (!command) {
        return false;
    }

    if (message.author?.id !== config.adminID) {
        addLastLog("ERROR", `Unauthorized command blocked: ${commandName}`);
        return true;
    }

    await command.execute({
        args: parts,
        config,
        message,
        state,
        addLog,
        addLastLog,
        resumeAccount,
        stopAccount,
    });

    return true;
}

async function handleMessage(message, isMainClient) {
    if (!message?.content) return;

    if (isMainClient) {
        await handleCommand(message);
    }
}

function startAutoMessage(client) {
    const sendAutomaticMessage = async () => {
        if (isPaused()) return;

        const content = getNextMessage();

        if (!content) {
            addLog("ERROR", "No message source enabled in config.json.");
            return;
        }

        const channel = client.channels.cache.get(config.CHANNEL_ID);

        if (!channel) {
            addLog("ERROR", `Channel not found: ${config.CHANNEL_ID}`);
            return;
        }

        const sent = await sendChannelMessage(channel, content);

        if (sent) {
            addLog("INFO", `Automatic message sent by ${client.user.username}.`);
        }
    };

    sendAutomaticMessage();
    setInterval(sendAutomaticMessage, config.MESAJ_GONDERIM_SURESI);
}

function cleanupTerminal() {
    process.stdout.write(`${ANSI.showCursor}${ANSI.clear}${ANSI.cursorHome}`);
}

process.once("SIGINT", () => {
    cleanupTerminal();
    process.exit(0);
});

process.once("SIGTERM", () => {
    cleanupTerminal();
    process.exit(0);
});

process.once("exit", () => {
    process.stdout.write(ANSI.showCursor);
});

process.stdout.write(`${ANSI.hideCursor}${ANSI.clear}${ANSI.cursorHome}`);

addLog("INFO", "Dashboard initialized");
addLog("SUCCESS", "Runtime monitors online");
addLog("INFO", "Waiting for account activity");
addLog("INFO", `Starting login for ${config.TOKENLER.length} accounts...`);
addLog("INFO", `${commands.size} command entries loaded.`);
setInterval(renderDashboard, 1000);

if (config.generatorjs === true && config.onlyonemessage === true) {
    addLastLog("WARN", "generatorjs and onlyonemessage are both true; generator.js will be used.");
}

if (!config.adminID) {
    addLastLog("WARN", "adminID is empty in config.json.");
}

if (config.TOKENLER.length === 0) {
    addLog("ERROR", "No tokens found in config.json.");
}

for (let index = 0; index < config.TOKENLER.length; index++) {
    const token = config.TOKENLER[index];
    const client = new Client({ checkUpdate: false });
    const isMainClient = index === 0;
    let autoMessagesStarted = false;

    client.on("messageCreate", (message) => {
        handleMessage(message, isMainClient);
    });

    client.on("ready", () => {
        if (autoMessagesStarted) return;

        autoMessagesStarted = true;
        addLog("SUCCESS", `${client.user.username} account is ready.`);
        startAutoMessage(client);
    });

    client
        .login(token)
        .then(() => {
            state.activeAccounts++;
            state.loginAttemptsFinished++;
            addLog("SUCCESS", `${client.user?.username || `Account ${index + 1}`} logged in.`);
            finishLoginAttempt();
        })
        .catch((error) => {
            state.invalidAccounts++;
            state.loginAttemptsFinished++;
            addLog(
                "ERROR",
                `[${index + 1}] Token login failed: ${error?.message || "Unknown"}`,
            );
            finishLoginAttempt();
        });
}