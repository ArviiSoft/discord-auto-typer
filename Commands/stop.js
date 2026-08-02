module.exports = {
    name: "stop",
    aliases: ["stp"],
    async execute({ stopAccount }) {
        stopAccount("Account stopped by admin command.");
    },
};
