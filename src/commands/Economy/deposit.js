import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed, buildUserErrorEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { addTransaction } from '../../utils/economy.js';

export default {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Save money into your Ipon Challenge')
        .addStringOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to save (number or "all")')
                .setRequired(true)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const amountInput = interaction.options.getString("amount");

        const userData = await getEconomyData(client, guildId, userId);

        if (!userData) {
            throw createError(
                "Failed to load savings data",
                ErrorTypes.DATABASE,
                "Unable to load your savings account. Please try again later."
            );
        }

        let depositAmount;

        if (amountInput.toLowerCase() === "all") {
            depositAmount = userData.wallet;
        } else {
            depositAmount = parseInt(amountInput);

            if (isNaN(depositAmount) || depositAmount <= 0) {
                throw createError(
                    "Invalid amount",
                    ErrorTypes.VALIDATION,
                    'Please enter a valid amount or type "all".'
                );
            }
        }

        if (userData.wallet <= 0) {
            throw createError(
                "No available money",
                ErrorTypes.VALIDATION,
                "You don't have any available money to save."
            );
        }

        if (depositAmount > userData.wallet) {
            depositAmount = userData.wallet;

            await interaction.followUp({
                embeds: [
                    buildUserErrorEmbed(
                        "validation",
                        `You only have **₱${depositAmount.toLocaleString()}** available. Saving everything you have.`
                    )
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        userData.wallet -= depositAmount;
        userData.bank += depositAmount;

        await setEconomyData(client, guildId, userId, userData);
        await addTransaction(
    client,
    guildId,
    userId,
    "withdraw",
    withdrawAmount
);

        const embed = successEmbed(
            "💰 Savings Updated",
            `🎉 You successfully saved **₱${depositAmount.toLocaleString()}**!\n\nKeep going—every peso counts toward your goal.`
        ).addFields(
            {
                name: "💵 Available Money",
                value: `₱${userData.wallet.toLocaleString()}`,
                inline: true,
            },
            {
                name: "🏦 Total Savings",
                value: `₱${userData.bank.toLocaleString()}`,
                inline: true,
            }
        );

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: "deposit" })
};
