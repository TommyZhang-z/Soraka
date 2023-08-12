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
        IRON: '<:IRON:1139928631968284756>',
        BRONZE: '<:BRONZE:1139927800577536071>',
        SILVER: '<:SILVER:1110106641380151296>',
        GOLD: '<:GOLD:1139925619887575091>',
        PLATINUM: '<:PLATINUM:1139922925189865492>',
        EMERALD: '<:EMERALD:1139930854991331379>',
        DIAMOND: '<:DIAMOND:1139926464796565524>',
        MASTER: '<:MASTER:1139927804159471786>',
        GRANDMASTER: '<:GRANDMASTER:1139929326750531615>',
        CHALLENGER: '<:CHALLENGER:1139928626956095578>',
      };

      const chineseMap = {
        IRON: '坚韧黑铁',
        BRONZE: '英勇黄铜',
        SILVER: '不屈白银',
        GOLD: '荣耀黄金',
        PLATINUM: '华贵铂金',
        EMERALD: '流光翡翠',
        DIAMOND: '璀璨钻石',
        MASTER: '超凡大师',
        GRANDMASTER: '傲世宗师',
        CHALLENGER: '最强王者',
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
              ? `单双: ${emojiMap[solo.tier] || ''} ${
                  chineseMap[solo.tier] || ''
                } ${['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(
                  solo.tier
                ) ? "" : rankMap[solo.rank]} ${solo.leaguePoints}胜点`
              : '单双: 未定位';

          const flex = account.rankedStatus.find(
            (status) => status.queueType === 'RANKED_FLEX_SR'
          );
          const flexString =
            flex !== undefined
              ? `灵活: ${emojiMap[flex.tier] || ''} ${
                  chineseMap[solo.tier] || ''
                } ${['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(
                  flex.tier
                ) ? "" : rankMap[flex.rank]} ${flex.leaguePoints}胜点`
              : '灵活: 未定位';
          embed.addFields({
            name: account.summonerName,
            value: `${soloString}\n${flexString}\n用户名: ${account.username}\n密码: ${account.password}`,
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
