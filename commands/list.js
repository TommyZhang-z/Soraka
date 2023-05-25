const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('list all Account Records that you have access to'),
  async execute(interaction, guild) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const userId = interaction.member.user.id.trim();
      const member = await guild.members.fetch(userId);
      const roles = member._roles;

      // retrieve all accounts if accounts disabled is false
      const querySnapshot = await db
        .collection('accounts')
        .where('disabled', '==', false)
        .get();

      // filter accounts by availableToUsers, availableToRoles, and account owner is the user
      const accounts = querySnapshot.docs
        .map((doc) => doc.data())
        .filter(
          (account) =>
            account.availableToUsers.includes(userId) ||
            account.availableToRoles.some((role) => roles.includes(role)) ||
            account.owner === userId
        )
        .sort((a, b) => a.summonerName.localeCompare(b.summonerName));

      if (accounts.length === 0) {
        await interaction.followUp({
          content: 'No accounts found!',
          ephemeral: true,
        });
        return;
      }

      const rankMap = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
      };

      const emojiMap = {
        IRON: '<:IRON:1110106634866409472>',
        BRONZE: '<:BRONZE:1110106623319486475>',
        SILVER: '<:SILVER:1110106641380151296>',
        GOLD: '<:GOLD:1110106630013595691>',
        PLATINUM: '<:PLATINUM:1110106639375274017>',
        DIAMOND: '<:DIAMOND:1110106627576700969>',
        MASTER: '<:MASTER:1110106636820959292>',
        GRANDMASTER: '<:GRANDMASTER:1110106632119144538>',
        CHALLENGER: '<:CHALLENGER:1110106626079330344>',
      };
      const splitArray = (array, chunkSize) => {
        let result = [];
        while (array.length) {
          result.push(array.splice(0, chunkSize));
        }
        return result;
      };
      const chunkedAccounts = splitArray(accounts, 16);
      const embeds = [];
      chunkedAccounts.forEach((chunk) => {
        const embed = new EmbedBuilder();
        chunk.forEach((account, index) => {
          const solo = account.rankedStatus.find(
            (status) => status.queueType === 'RANKED_SOLO_5x5'
          );
          const soloString =
            solo !== undefined
              ? `Solo Rank: ${emojiMap[solo.tier]} ${
                  solo.tier.charAt(0) + solo.tier.slice(1).toLowerCase()
                } ${rankMap[solo.rank]} ${solo.leaguePoints} LP`
              : 'Solo Rank: UNRANKED';

          const flex = account.rankedStatus.find(
            (status) => status.queueType === 'RANKED_FLEX_SR'
          );
          const flexString =
            flex !== undefined
              ? `Flex Rank: ${emojiMap[flex.tier]} ${
                  flex.tier.charAt(0) + flex.tier.slice(1).toLowerCase()
                } ${rankMap[flex.rank]} ${flex.leaguePoints} LP`
              : 'Flex Rank: UNRANKED';
          embed.addFields({
            name: account.summonerName,
            value: `${soloString}\n${flexString}\nUsername: ${account.username}\nPassword: ${account.password}`,
            inline: true,
          });
          if (index % 2 === 1) {
            embed.addFields({ name: '\u200b', value: '\u200b' });
          }
        });
        embeds.push(embed);
      });

      await interaction.followUp({
        embeds,
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
      await interaction.followUp({
        content: 'Could not list accounts!',
        ephemeral: true,
      });
    }
  },
};
