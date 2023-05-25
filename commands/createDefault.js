const { SlashCommandBuilder } = require('discord.js');
const { createHelper } = require('./utils/createHelper');

const default_role =
  process.env.DISCORD_DEFAULT_PERMISSION_GROUP || '1106292900775608430';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-default')
    .setDescription('Create an Account Record!')
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
    )
    .addStringOption((option) =>
      option
        .setName('summoner-name')
        .setDescription('Summoner name for your account')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('owner')
        .setDescription('Owner of the account')
        .setRequired(false)
    ),
  async execute(interaction, _guild) {
    await createHelper(interaction, [default_role]);
  },
};
