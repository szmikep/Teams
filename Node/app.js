const restify = require('restify');
const builder = require('botbuilder');
const teamsBuilder = require('botbuilder-teams');
const CookieParser = require('restify-cookies');
/*
process.env.TEAMS_APP_ID = (process.env.TEAMS_APP_ID) ? process.env.TEAMS_APP_ID : ''; //This is the Teams App ID from your Manifest
process.env.MICROSOFT_APP_ID = (process.env.MICROSOFT_APP_ID) ? process.env.MICROSOFT_APP_ID : ''; //Bot ID from Bot Framework
process.env.MICROSOFT_APP_PASSWORD = (process.env.MICROSOFT_APP_PASSWORD) ? process.env.MICROSOFT_APP_PASSWORD : ''; //Bot password from Bot Framework
process.env.AUTH_CLIENT_ID = (process.env.AUTH_CLIENT_ID) ? process.env.AUTH_CLIENT_ID : '[auth client ID]';
process.env.AUTH_CLIENT_SECRET = (process.env.AUTH_CLIENT_SECRET) ? process.env.AUTH_CLIENT_SECRET : '[auth client secret]';
process.env.BASE_URI = (process.env.BASE_URI) ? process.env.BASE_URI : '';  //the host name for your tab
*/
process.env.TEAMS_APP_ID = 'F90C7384-2CD2-4E81-8593-A9F8841D9F36'; //This is the Teams App ID from your Manifest
process.env.MICROSOFT_APP_ID = '3fbfe6fc-9446-496d-82c7-ab234cdfeb08'; //Bot ID from Bot Framework
process.env.MICROSOFT_APP_PASSWORD = 'jjEI48;=wvtzrOEWSC890%\\'; //Bot password from Bot Framework
process.env.AUTH_CLIENT_ID = (process.env.AUTH_CLIENT_ID) ? process.env.AUTH_CLIENT_ID : '[auth client ID]';
process.env.AUTH_CLIENT_SECRET = (process.env.AUTH_CLIENT_SECRET) ? process.env.AUTH_CLIENT_SECRET : '[auth client secret]';
process.env.BASE_URI = 'https://62f3fa02.ngrok.io';  //the host name for your tab
process.env.CONNECTOR_APP_ID = 'ed618917-c700-4ae1-97a4-a9e24eeb9281';

// Setup Restify Server
var server = restify.createServer();
server.use(restify.queryParser());
server.use(CookieParser.parse);
server.use(restify.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get(/\/static\/?.*/, restify.serveStatic({
    directory: __dirname 
}));

// Create connector
var chatConnector = new teamsBuilder.TeamsChatConnector({ 
	appId: process.env.MICROSOFT_APP_ID, 
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Setup bot
var bot = new builder.UniversalBot(chatConnector);

//Initialize bot 
var botHandler = require('./bot/bot.js');
botHandler.init(server, chatConnector, bot);
botHandler.start_listening();

//Initialize ComposeExtension 
var composeHandler = require('./compose/compose.js');
composeHandler.init(server, chatConnector, bot);

//Initialize O365 Connector handler 
var connectorHandler = require('./connector/connector.js');
connectorHandler.init(server);
connectorHandler.start_listening();

//Initialize Tab handler 
var tabsHandler = require('./tabs/tabs.js');
tabsHandler.init(server);
tabsHandler.start_listening();

//Initialize authorization test handler
var authHandler = require('./auth/auth.js');
authHandler.init(server);
authHandler.start_listening();

//Initial Graph API test handler
var graphHandler = require('./graph/graph.js');
graphHandler.init(server);
graphHandler.start_listening();
