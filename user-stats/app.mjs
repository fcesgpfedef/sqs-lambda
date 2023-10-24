/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

import * as zoomCall from './lib/utils.js';
import  { MongoClient }  from 'mongodb';
const url = 'mongodb+srv://qct_test:DDFMd0WyAXTlfM2c@cluster0.1p24moe.mongodb.net';
const client = new MongoClient(url);
const dbName = 'superMind';

export const lambdaHandler = async (event, context) => {
    console.log('Event from SQS', JSON.stringify(event));
    const bodyFromEvent = JSON.parse(event.Records[0].body);
    const parsedBody = JSON.parse(bodyFromEvent['Message']);
    
    const db = client.db(dbName);
    const collection = db.collection('tokens');
    const meetingID = parsedBody.object.id;
    const accountID = parsedBody.account_id;
    const updateResult = await collection.findOne({ accountName: "Sagar" });
    const accessToken = updateResult.token;
    const configPastInstances = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.zoom.us/v2/past_meetings/${meetingID}/instances`,
        headers: {
            'Authorization': `Bearer ${accessToken}`, 
        }
    };

    // Make a call to get the past instances
    const zoomRes = await zoomCall.makeZoomCall(configPastInstances, accountID);
    const sortedData= zoomRes.meetings.sort((function (a, b) { 
        return new Date(b.start_time) - new Date(a.start_time) 
    }));

    console.log('sortedData....', JSON.stringify(sortedData));
    let configParticipants = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.zoom.us/v2/past_meetings/${sortedData[0]['uuid']}/participants?page_size=300`,
        headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        }
    };

    const zoomParticipantsRes = await zoomCall.makeZoomCall(configParticipants, accountID);
    console.log(zoomParticipantsRes);
    const userDataToBeInserted = {};
    userDataToBeInserted.meetingID = meetingID;
    userDataToBeInserted.meetingInstance = sortedData[0];
    userDataToBeInserted.participants = zoomParticipantsRes.participants;
    await db.collection('zoomMeetingUserData').insertOne(userDataToBeInserted);
    try {
        return {
            'statusCode': 200,
            'body': JSON.stringify(zoomParticipantsRes)
        }
    } catch (err) {
        console.log(err);
        return err;
    }
};
