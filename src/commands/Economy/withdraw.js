import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw money from your savings')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to withdraw')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const amountInput = interaction.options.getInteger("amount");

        const userData = await getEconomyData(client, guildId, userId);

        if (!userData) {
            throw createError(
                "Failed to load savings data",
                ErrorTypes.DATABASE,
                "Unable to load your savings data. Please try again later."
            );
        }

        let withdrawAmount = amountInput;

        if (withdrawAmount <= 0) {
            throw createError(
                "Invalid amount",
                ErrorTypes.VALIDATION,
                "Please enter a valid amount greater than 0."
            );
        }

        if (withdrawAmount > userData.bank) {
            withdrawAmount = userData.bank;
        }

        if (withdrawAmount === 0) {
            throw createError(
                "No savings available",
                ErrorTypes.VALIDATION,
                "You don't have any savings to withdraw."
            );
        }

        // Move money from Savings to Available Money
        userData.wallet += withdrawAmount;
        userData.bank -= withdrawAmount;

        await setEconomyData(client, guildId, userId, userData);

        const embed = successEmbed(
            "💸 Withdrawal Successful",
            `You withdrew **₱${withdrawAmount.toLocaleString()}** from your savings.`
        )
        .addFields(
            {
                name: "💵 Available Money",
                value: `₱${userData.wallet.toLocaleString()}`,
                inline: true,
            },
            {
                name: "🏦 Remaining Savings",
                value: `₱${userData.bank.toLocaleString()}`,
                inline: true,
            }
        );

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: "withdraw" })
};
