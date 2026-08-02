module.exports = {
    name: "start",
    aliases: ["strt"],
    async execute({ resumeAccount }) {
        resumeAccount("Account started by admin command.");
    },
};
