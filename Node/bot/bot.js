const builder = require("botbuilder");
const teams = require("botbuilder-teams");
const utils = require('../utils/utils.js');
const Client = require("node-rest-client").Client;
const uuid = require('node-uuid');


///////////////////////////////////////////////////////
//	Local Variables
///////////////////////////////////////////////////////
var client = new Client(); //Restler client so we can make rest requests
var server; //Restify server
var connector; //This is the connector
var bot; //Bot from botbuilder sdk
var sentMessages = {}; //Dictionary that maps task IDs to messages that have already been sent.

///////////////////////////////////////////////////////
//	Bot and listening
///////////////////////////////////////////////////////
// Starts the bot functionality of this app
function start_listening() {
	this.server.post('api/messages', this.connector.listen());

	// Listen for bot dialog messages
	this.bot.dialog('/', (session) => {

		// Make sure you strip mentions out before you parse the message
		var text = teams.TeamsMessage.getTextWithoutMentions(session.message).toLowerCase();
		console.log('dialog started ' + text);

		var split = text.split(' ');
		var cmd = split[0];
		var params = split.slice(1).join(' ');

		//Single word commands:
		if (split.length < 2 ) {
			if (cmd.includes('help')) {
				sendHelpMessage(session.message, this.bot, `Hi, I'm a sample bot in Node.js`);
			} else {
				sendHelpMessage(session.message, this.bot, `I'm sorry, I did not understand you :( `);
			}
		} else {
			// Parse the command and go do the right thing
			if (cmd.includes('create') || cmd.includes('find')) {
				sendCardMessage(session, this.bot, params);
			} else if (cmd.includes('assign')) {
				var taskId = params;
				if (sentMessages[taskId]) {
					// Send message update.
					sendCardUpdate(session, this.bot, taskId);
				}
			} else if (cmd.includes('link')) {
				createDeepLink(session.message, this.bot, params);
			}
		}
	});

	// When a bot is added or removed we get an event here. Event type we are looking for is teamMember added
	this.bot.on('conversationUpdate', (msg) => {

		console.log('Sample app was added to the team');

		if (!msg.eventType === 'teamMemberAdded') return;
		
		if (!Array.isArray(msg.membersAdded) || msg.membersAdded.length < 1) return;

		var members = msg.membersAdded;

		// Loop through all members that were just added to the team
		for (var i = 0; i < members.length; i++) {
			
			// See if the member added was our bot
			if (members[i].id.includes(process.env.MICROSOFT_APP_ID)) {
				sendHelpMessage(msg, this.bot, `Hi, I'm a sample bot in Node.js!`);
			}
		}
	});
}

///////////////////////////////////////////////////////
//	Helpers and other methods
///////////////////////////////////////////////////////
// Generate a deep link that points to a tab
function createDeepLink(message, bot, tabName) {

	var name = tabName;
	var teamId = message.sourceEvent.teamsTeamId;
	var channelId = message.sourceEvent.teamsChannelId;

	var appId = process.env.TEAMS_APP_ID; // This is the app ID you set up in your manifest.json file.
	var entity = `todotab-${name}-${teamId}-${channelId}`; // Match the entity ID we setup when configuring the tab
	var context = {
		channelId: channelId,
		canvasUrl: 'https://teams.microsoft.com'
	};

	var url = `https://teams.microsoft.com/l/entity/${encodeURIComponent(appId)}/${encodeURIComponent(entity)}?label=${encodeURIComponent(name)}&context=${encodeURIComponent(JSON.stringify(context))}`;

	var text = `Here's your [deeplink](${url}): \n`;
	text += `\`${decodeURIComponent(url)}\``;

	sendMessage(message, bot, text);
}

// Stub for sending a message with a new task
function sendTaskMessage(message, bot, taskTitle) {
	var task = utils.createTask();

	task.title = taskTitle;

	var text = `Here's your task: \n\n`;
	text += `---\n\n`;
	text += `**Task Title:** ${task.title}\n\n`;
	text += `**![${task.title}](${`${process.env.BASE_URI}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`})\n\n`;
	text += `**Task ID:** ${10}\n\n`;
	text += `**Task Description:** ${task.description}\n\n`;
	text += `**Assigned To:** ${task.assigned}\n\n`;

	sendMessage(message, bot, text);
}

// Send a card update for the given task ID.
function sendCardUpdate(session, bot, taskId) {
	var sentMsg = sentMessages[taskId];

	var origAttachment = sentMsg.msg.data.attachments[0];
	origAttachment.content.subtitle = 'Assigned to: ' + sentMsg.address.user.name;

	var updatedMsg = new builder.Message()
		.address(sentMsg.address)
		.textFormat(builder.TextFormat.markdown)
		.addAttachment(origAttachment)
		.toMessage();

	session.connector.update(updatedMsg, function(err, addresses) {
		if (err) {
			console.log(`Could not update message with task ID: ${taskId}`);
		}
	});
}

// Helper method to generate a card message for a given task.
function sendCardMessage(session, bot, taskTitle) {
	var task = utils.createTask();
	task.title = taskTitle;

	// Generate a random GUID for this task object.
	var taskId = uuid.v4();

	var updateBtn = new builder.CardAction()
		.title('Assign to me')
		.type('imBack')
		.value('assign ' + taskId);

	var card = new builder.ThumbnailCard()
		.title(task.title)
		.subtitle('UNASSIGNED')
		.text(task.description)
		.images([
			builder.CardImage.create(null, `${process.env.BASE_URI}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`)
		])
		.buttons([
			builder.CardAction.openUrl(null, 'http://www.microsoft.com', 'View task'),
			builder.CardAction.openUrl(null, 'https://products.office.com/en-us/microsoft-teams/group-chat-software', 'View in list'),
			updateBtn,
		]);

	var msg = new builder.Message()
		.address(session.message.address)
		.textFormat(builder.TextFormat.markdown)
		.addAttachment(card);

	bot.send(msg, function(err, addresses) {
		if (addresses && addresses.length > 0) {
			sentMessages[taskId] = {
				'msg': msg, 'address': addresses[0]
			};
		}
	});
}

// Helper method to send a text message
function sendMessage(message, bot, text) {
	var msg = new builder.Message()
		.address(message.address)
		.textFormat(builder.TextFormat.markdown)
		.text(text);

	bot.send(msg, function(err) {});
}

// Helper method to send a generic help message
function sendHelpMessage(message, bot, firstLine) {
	var text = `**${firstLine}** \n\n\n Here's what I can help you do \n\n\n`
	text += `To create a new task, you can type **create** followed by the task name\n\n`
	text += `To find an existing task, you can type **find** followed by the task name\n\n`
	text += `To create a deep link, you can type **link** followed by the tab name`;

	sendMessage(message, bot, text);
}

///////////////////////////////////////////////////////
//	Exports
///////////////////////////////////////////////////////
module.exports.init = function(server, connector, bot) {
	this.server = server;
	this.connector = connector;
	this.bot = bot;
	return this;
}

module.exports.start_listening = start_listening;