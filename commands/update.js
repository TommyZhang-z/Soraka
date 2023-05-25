const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update an Account Record!')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Username for your account')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('password')
        .setDescription('Password for your account')
        .setRequired(true)
    ),
  async execute(interaction, _guild) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const username = interaction.options.getString('username');
      const password = interaction.options.getString('password');
      const querySnapshot = await db
        .collection('accounts')
        .where('username', '==', username)
        .get();
      if (querySnapshot.empty) {
        await interaction.followUp({
          content: 'No accounts found!',
          ephemeral: true,
        });
        return;
      }
      const docRef = querySnapshot.docs[0];
      if (docRef.data().owner !== interaction.member.user.id) {
        await interaction.followUp({
          content: 'You do not own this account!',
          ephemeral: true,
        });
        return;
      }
      // set new password
      docRef.ref.update({ password });
      await interaction.followUp({
        content: `Account ${username} updated!`,
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
      await interaction.followUp({
        content: `Error updating: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
