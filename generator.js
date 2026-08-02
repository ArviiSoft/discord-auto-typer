const subjects = [
    "The auto typer",
    "The message queue",
    "The channel",
    "The session",
    "The sender",
    "The text line",
    "The next update",
    "The quick note",
    "The typing flow",
    "The message loop",
    "The active account",
    "The saved message",
    "The config",
    "The schedule",
    "The command panel",
    "The dashboard",
    "The status line",
    "The runtime",
    "The message source",
    "The text generator",
];

const adverbs = [
    "quickly",
    "quietly",
    "randomly",
    "smoothly",
    "casually",
    "calmly",
    "patiently",
    "carefully",
    "slowly",
    "instantly",
    "properly",
    "neatly",
    "finally",
    "silently",
    "honestly",
    "briefly",
    "safely",
    "clearly",
    "normally",
    "naturally",
    "regularly",
    "politely",
    "accurately",
];

const verbs = [
    "sent",
    "typed",
    "queued",
    "prepared",
    "checked",
    "saved",
    "updated",
    "opened",
    "closed",
    "marked",
    "logged",
    "shared",
    "reviewed",
    "confirmed",
    "refreshed",
    "remembered",
    "scheduled",
    "selected",
    "generated",
    "posted",
];

const adjectives = [
    "clean",
    "fresh",
    "small",
    "big",
    "quiet",
    "simple",
    "random",
    "bright",
    "quick",
    "steady",
    "new",
    "old",
    "common",
    "special",
    "smooth",
    "early",
    "late",
    "active",
    "daily",
    "weekly",
    "complete",
    "empty",
    "full",
    "favorite",
    "normal",
];

const objects = [
    "the next message",
    "a short update",
    "the saved text",
    "the message list",
    "the channel",
    "the dashboard",
    "a new line",
    "the text source",
    "the active session",
    "the message history",
    "the status panel",
    "the command result",
    "the queue",
    "the current note",
    "the selected message",
    "the automatic post",
    "the typing session",
    "the scheduled text",
    "the latest update",
    "the message template",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateSentence() {
    const sub = pickRandom(subjects);
    const adv = pickRandom(adverbs);
    const verb = pickRandom(verbs);
    const adj = pickRandom(adjectives);
    const obj = pickRandom(objects);

    const templateType = Math.floor(Math.random() * 5) + 1;

    switch (templateType) {
        case 1:
            return `${sub}.`;
        case 2:
            return `${sub} ${verb}.`;
        case 3:
            return `${sub} ${verb} ${obj}.`;
        case 4:
            return `${sub} ${adv} ${verb} ${obj}.`;
        default:
            return `${sub} ${adv} ${verb} ${adj} ${obj}.`;
    }
}

module.exports = generateSentence;
