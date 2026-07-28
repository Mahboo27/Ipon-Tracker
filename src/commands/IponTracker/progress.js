import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/embeds.js";
import { getEconomyData } from "../../utils/economy.js";
import { InteractionHelper } from "../../utils/interactionHelper.js";

export default {
    data: new SlashCommandBuilder()
        .setName("progress")
        .setDescription("View your savings progress for this month"),

    async execute(interaction, config, client) {

        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userData = await getEconomyData(
            client,
            interaction.guildId,
            interaction.user.id
        );

        const transactions = userData.transactions || [];

        const now = new Date();

        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);

            return (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            );
        });

        let deposits = 0;
        let withdrawals = 0;

        for (const transaction of monthlyTransactions) {
            if (transaction.type === "deposit") {
                deposits += transaction.amount;
            }

            if (transaction.type === "withdraw") {
                withdrawals += transaction.amount;
            }
        }

        const netSavings = deposits - withdrawals;
        const totalMoney = userData.wallet + userData.bank;

        const progressBar = (percent) => {
            const filled = Math.round(percent / 10);
            return "█".repeat(filled) + "░".repeat(10 - filled);
        };

        const percent =
            totalMoney === 0
                ? 0
                : Math.round((userData.bank / totalMoney) * 100);

        const embed = createEmbed({
            title: "📊 Savings Progress",
            description: "Your savings overview for this month."
        })
        .addFields(
            {
                name: "🏦 Current Savings",
                value: `₱${userData.bank.toLocaleString()}`,
                inline: true
            },
            {
                name: "💵 Available Money",
                value: `₱${userData.wallet.toLocaleString()}`,
                inline: true
            },
            {
                name: "💰 Total Money",
                value: `₱${totalMoney.toLocaleString()}`,
                inline: true
            },
            {
                name: "📈 Deposited This Month",
                value: `₱${deposits.toLocaleString()}`,
                inline: true
            },
            {
                name: "📉 Withdrawn This Month",
                value: `₱${withdrawals.toLocaleString()}`,
                inline: true
            },
            {
                name: "💹 Net Savings",
                value: `₱${netSavings.toLocaleString()}`,
                inline: true
            },
            {
                name: "Savings Ratio",
                value: `${progressBar(percent)} ${percent}%`
            }
        );

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });
    }
};
