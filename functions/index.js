const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const RIOT_APIKEY = functions.config().riot.key;
const BY_PUUID =
  'https://oc1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}';
const BY_SUMMONER_ID =
  'https://oc1.api.riotgames.com/lol/league/v4/entries/by-summoner/{encryptedSummonerId}';

exports.updateFirestore = functions
  .region('australia-southeast1')
  .https.onRequest(async (_req, res) => {
    // log trigger time
    console.log('updateFirestore triggered at', new Date().toLocaleString());

    // for each record in the firestore collection, fetch the summoner data from the riot api
    // and update the firestore record with the new data
    // region = oce
    const accounts = await db.collection('accounts').get();

    try {
      for (const account of accounts.docs) {
        const { puuid } = account.data();

        const response = await fetch(
          BY_PUUID.replace('{encryptedPUUID}', puuid),
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
        const { id, name } = data;

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

        account.ref.update({
          rankedStatus,
          summonerName: name,
        });
      }

      // Send a response only once, after all updates are complete
      res.status(200).send('Success!');
    } catch (error) {
      console.error('Update operation failed: ', error);
      // Send an error response
      res.status(500).send('Update operation failed!');
    }
  });
