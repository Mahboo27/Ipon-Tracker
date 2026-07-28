import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { getEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription("View your savings balance")
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription("View another user's savings")
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userOption = interaction.options.getUser("user");
        const targetUser = userOption || interaction.user;
        const guildId = interaction.guildId;

        if (targetUser.bot) {
            throw createError(
                "Bot user queried",
                ErrorTypes.VALIDATION,
                "Bots don't have a savings account."
            );
        }

        const userData = await getEconomyData(client, guildId, targetUser.id);

        if (!userData) {
            throw createError(
                "Failed to load savings data",
                ErrorTypes.DATABASE,
                "Unable to load savings data. Please try again later."
            );
        }

        const wallet = typeof userData.wallet === "number" ? userData.wallet : 0;
        const savings = typeof userData.bank === "number" ? userData.bank : 0;
        const total = wallet + savings;

        const embed = createEmbed({
            title: `🏦 ${targetUser.username}'s Ipon Tracker`,
            description: "Here's your current savings summary.",
        })
        .addFields(
            {
                name: "💵 Available Money",
                value: `₱${wallet.toLocaleString()}`,
                inline: true,
            },
            {
                name: "🏦 Total Savings",
                value: `₱${savings.toLocaleString()}`,
                inline: true,
            },
            {
                name: "💰 Total Assets",
                value: `₱${total.toLocaleString()}`,
                inline: true,
            }
        )
        .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

        logger.info("[IPON TRACKER] Balance viewed", {
            userId: targetUser.id,
            wallet,
            savings,
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed],
        });

    }, { command: "balance" })
};
