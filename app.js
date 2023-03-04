const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const convertPlayerObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB ERROR:${e}`);
    process.exit(1);
  }
};
app.get("/players/", async (request, response) => {
  const getQuery = `SELECT * 
    FROM player_details;`;
  const getDetails = await db.all(getQuery);
  response.send(
    getDetails.map((eachObject) => convertPlayerObject(eachObject))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT * FROM player_details 
    WHERE player_id=${playerId};`;
  const getDetails = await db.get(getQuery);
  response.send(convertPlayerObject(getDetails));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putQuery = `UPDATE player_details
    SET player_name="${playerName}" 
    WHERE player_id=${playerId};`;
  await db.run(putQuery);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `SELECT * 
    FROM match_details WHERE match_id=${matchId};`;
  const getDetails = await db.get(getQuery);
  response.send(convertMatchObject(getDetails));
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT match_details.match_id AS match_id,match_details.match AS match,match_details.year AS year FROM player_match_score 
    NATURAL JOIN  match_details 
     WHERE player_match_score.player_id=${playerId};`;
  const getDetails = await db.get(getQuery);
  response.send(getDetails.map((eachObject) => convertMatchObject(eachObject)));
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `SELECT * FROM player_match_score
    NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const getDetails = await db.get(getQuery);
  response.send(
    getDetails.map((eachObject) => convertPlayerObject(eachObject))
  );
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const getDetails = await db.get(getPlayerScored);
  response.send(getDetails);
});
InitializeDBAndServer();
module.exports = app;
