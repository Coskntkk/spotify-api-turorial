//** index.js */
// Import packages
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

// App config
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// This is needed because Spotify recommends using it 🤷‍♂️
function generateRandomString(length) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = Array(length).fill(characters).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    return result;
}
// Your client id
const client_id = process.env.CLIENT_ID;
// Your client secret
const client_secret = process.env.CLIENT_SECRET;
// Your redirect uri for spotify to redirect to after login 
// (This must be same with the form we filled before)
const redirect_uri = "http://localhost:8000/callback";
// Your scope, list of permissions you want to access
const scope = 'user-read-private user-read-email';

app.get('/login', function (req, res) {
    // Redirect user to spotify login page
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: generateRandomString(16)
        }));
});

app.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        // return error if state is not found
        if (!state) return res.status(400).send('State not found');
        // retrieve access token of user from spotify
        let responseTokens = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }),
            headers: {
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            },
            json: true
        });
        const { access_token } = responseTokens.data;
        // retrieve user information from spotify
        let responseUserInfo = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            json: true
        });

        //* Do something with user information here
        //* For example, save user information to database, etc.
        console.log(responseUserInfo.data);

        // return success response
        res.status(200).send("Login success!");
    } catch (err) {
        console.log(err);
        res.status(500).send('Something went wrong.');
    }
});

// Run server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
