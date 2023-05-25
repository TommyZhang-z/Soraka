const { SlashCommandBuilder, Role, GuildMember } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grant')
    .setDescription('Grant access to an Account Record!')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Username for your account')
        .setRequired(true)
    )
    .addMentionableOption((option) =>
      option
        .setName('to')
        .setDescription('User/Role to grant access to')
        .setRequired(true)
    ),
  async execute(interaction, _guild) {
    const username = interaction.options.getString('username');
    const to = interaction.options.getMentionable('to');
    if (!username || !to) {
      await interaction.reply({
        content: 'Missing required parameters!',
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply();
    try {
      const querySnapshot = await db
        .collection('accounts')
        .where('username', '==', username)
        .get();

      if (querySnapshot.empty) {
        console.log(`Account with username ${username} not found`);
        await interaction.followUp({
          content: `Account with username ${username} not found`,
        });
        return;
      }

      const account = querySnapshot.docs[0].data();
      if (account.owner !== interaction.member.user.id) {
        console.log(`Account with username ${username} is owned by ${account.owner}`);
        await interaction.followUp({
          content: `Account with username ${username} is owned by <@${account.owner}>`,
        });
        return;
      }

      if (to instanceof GuildMember) {
        if (account.availableToUsers.includes(to.id)) {
          console.log(
            `Account with username ${username} already available to ${to.displayName}`
          );
          await interaction.followUp({
            content: `Account with username ${username} already available to ${to.displayName}`,
          });
          return;
        }

        await db
          .collection('accounts')
          .doc(querySnapshot.docs[0].id)
          .update({
            availableToUsers: [...account.availableToUsers, to.id],
          });

        await interaction.followUp({
          content: `Granted access to <@${to.id}> for account with username ${username}`,
        });
      } else if (to instanceof  Role) {
        if (account.availableToRoles.includes(to.id)) {
          console.log(
            `Account with username ${username} already available to ${to.name}`
          );
          await interaction.followUp({
            content: `Account with username ${username} already available to ${to.name}`,
          });
          return;
        }

        await db
          .collection('accounts')
          .doc(querySnapshot.docs[0].id)
          .update({
            availableToRoles: [...account.availableToRoles, to.id],
          });

          await interaction.followUp({
            content: `Granted access to <@&${to.id}> for account with username ${username}`,
          });
          
      } else {
        console.log(`Invalid mentionable type: ${to}`);
        await interaction.followUp({
          content: `Invalid mentionable type: ${to}`,
        });
      }
    } catch (error) {
      console.log(error);
      await interaction.followUp({
        content: 'Could not grant access!',
      });
    }
  },
};
