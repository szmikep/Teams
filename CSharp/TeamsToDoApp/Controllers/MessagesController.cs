﻿using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Connector.Teams;
using Microsoft.Bot.Connector.Teams.Models;

namespace TeamsSampleTaskApp
{
    [BotAuthentication]
    public class MessagesController : ApiController
    {

        /// <summary>
        /// POST: api/Messages
        /// Receive a message from a user and reply to it
        /// </summary>
        public async Task<HttpResponseMessage> Post([FromBody]Activity activity)
        {
          
            if (activity.Type == ActivityTypes.Message) 
            {
                //Handle basic message types, e.g. user initiated
                await Conversation.SendAsync(activity, () => new Dialogs.RootDialog());
            }
            else if (activity.Type == ActivityTypes.Invoke) 
            {
                //Compose extensions come in as Invokes.  Leverage the Teams SDK helper functions
                if (activity.IsComposeExtensionQuery())
                {
                    // Determine the response object to reply with
                    var invokeResponse = new ComposeExtension(activity).CreateComposeExtensionResponse();

                    // Return the response
                    return Request.CreateResponse<ComposeExtensionResponse>(HttpStatusCode.OK, invokeResponse);
                } else
                {
                    // Handle other types of Invoke activities here, e.g. CardActions
                }
            }
            else
            {
                await HandleSystemMessage(activity);
            }
            var response = Request.CreateResponse(HttpStatusCode.OK);
            return response;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        private async Task HandleSystemMessage(Activity message)
        {

            if (message.Type == ActivityTypes.ConversationUpdate)
            {
                // Handle conversation state changes, like members being added and removed
                // Use Activity.MembersAdded and Activity.MembersRemoved and Activity.Action for info

                // This event is called when the Bot is added too, so we can trigger a welcome message if the member added is the bot:
                TeamEventBase eventData = message.GetConversationUpdateData();
                if (eventData.EventType == TeamEventType.MembersAdded)
                {
                    for (int i = 0; i < message.MembersAdded.Count; i++)
                    {
                        //Check to see if the member added was the bot itself.  We're leveraging the fact that the inbound payload's Recipient is the bot.
                        if (message.MembersAdded[i].Id == message.Recipient.Id)
                        {
                            // We'll use normal message parsing to display the welcome message.
                            message.Text = "welcome";
                            await Conversation.SendAsync(message, () => new Dialogs.RootDialog());

                            break;
                        }
                    }
                }
            }
            else if (message.Type == ActivityTypes.DeleteUserData)
            {
                // Implement user deletion here
                // If we handle user deletion, return a real message
            }
            else if (message.Type == ActivityTypes.ContactRelationUpdate)
            {
                // Handle add/remove from contact lists
            }
            else if (message.Type == ActivityTypes.Typing)
            {
                // Handle knowing that the user is typing
            }
            else if (message.Type == ActivityTypes.Ping)
            {

            }
        }
    }
}