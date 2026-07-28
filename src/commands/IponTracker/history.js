import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/embeds.js";
import { getEconomyData } from "../../utils/economy.js";
import { InteractionHelper } from "../../utils/interactionHelper.js";

export default {
    data: new SlashCommandBuilder()
        .setName("history")
        .setDescription("View your recent savings transactions"),

    async execute(interaction, config, client) {

        await InteractionHelper.safeDefer(interaction);

        const userData = await getEconomyData(
            client,
            interaction.guildId,
            interaction.user.id
        );

        const history = userData.transactions || [];

        if (history.length === 0) {
            return InteractionHelper.safeEditReply(interaction, {
                content: "📜 No transaction history yet."
            });
        }

        const text = history
            .slice(0, 10)
            .map(t => {

                const icon =
                    t.type === "deposit"
                        ? "💰"
                        : "💸";

                return `${icon} **${t.type.toUpperCase()}**
₱${t.amount.toLocaleString()}
<t:${Math.floor(t.date / 1000)}:R>`;

            }).join("\n\n");

        const embed = createEmbed({
            title: "📜 Savings History",
            description: text
        });

        await InteractionHelper.safeEditReply(interaction,{
            embeds:[embed]
        });

    }
};
