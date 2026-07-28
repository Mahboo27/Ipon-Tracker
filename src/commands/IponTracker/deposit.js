const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("depositm")
        .setDescription("Deposit money into your savings")
        .addNumberOption(option =>
            option
                .setName("amount")
                .setDescription("Amount to deposit")
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getNumber("amount");

        await interaction.reply({
            content: `💰 Successfully deposited **₱${amount.toLocaleString()}** into your savings!`,
        });
    },
};
