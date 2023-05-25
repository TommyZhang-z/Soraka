const { db } = require('../../firebase');
const fetch = require('node-fetch');

const RIOT_APIKEY = process.env.RIOT_GAMES_DEVELOPER_API_KEY;
const BY_SUMMONER_NAME =
  'https://oc1.api.riotgames.com/lol/summoner/v4/summoners/by-name/{summonerName}';
const BY_SUMMONER_ID =
  'https://oc1.api.riotgames.com/lol/league/v4/entries/by-summoner/{encryptedSummonerId}';

const createHelper = async (interaction, defaultPermissionGroups) => {
  const username = interaction.options.getString('username');
  const password = interaction.options.getString('password');
  const summonerName = interaction.options.getString('summoner-name');
  const owner = interaction.options.getUser('owner');
  if (!username || !password || !summonerName) {
    await interaction.reply({
      content: 'Missing required parameters!',
      ephemeral: true,
    });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const querySnapshot = await db
      .collection('accounts')
      .where('username', '==', username)
      .get();
    if (!querySnapshot.empty) {
      console.log(`Account with username ${username} already exists`);
      await interaction.followUp({
        content: `Account with username ${username} already exists`,
        ephemeral: true,
      });
      return;
    }

    const response = await fetch(
      BY_SUMMONER_NAME.replace('{summonerName}', summonerName),
      {
        headers: {
          'X-Riot-Token': RIOT_APIKEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { id, puuid } = data;

    const response2 = await fetch(
      BY_SUMMONER_ID.replace('{encryptedSummonerId}', id),
      {
        headers: {
          'X-Riot-Token': RIOT_APIKEY,
        },
      }
    );

    if (!response2.ok) {
      throw new Error(`HTTP error! status: ${response2.status}`);
    }

    const data2 = await response2.json();

    const rankedStatus = data2
      .filter(
        (item) =>
          item.queueType === 'RANKED_SOLO_5x5' ||
          item.queueType === 'RANKED_FLEX_SR'
      )
      // map item, only keep queueType, tier, rank, leaguePoints, wins, losses
      .map(({ queueType, tier, rank, leaguePoints }) => ({
        queueType,
        tier,
        rank,
        leaguePoints,
      }));

    await db.collection('accounts').add({
      owner: owner ? owner.id : interaction.member.user.id,
      puuid,
      username,
      password,
      rankedStatus,
      summonerName,
      disabled: false,
      availableToUsers: [],
      availableToRoles: defaultPermissionGroups,
    });
    await interaction.followUp({
      content: `Created account with summoner name: ${summonerName}`,
      ephemeral: true,
    });
  } catch (error) {
    console.log(error);
    await interaction.followUp({
      content: 'Could not create account!',
      ephemeral: true,
    });
  }
};

module.exports = { createHelper };
