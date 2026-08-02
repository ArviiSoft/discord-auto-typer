module.exports = {
    name: "durdur",
    aliases: ["stop"],
    async execute({ stopAccount }) {
        stopAccount("Account stopped by admin command.");
    },
};
