module.exports = {
    name: "başlat",
    aliases: ["baslat", "start"],
    async execute({ resumeAccount }) {
        resumeAccount("Account started by admin command.");
    },
};
