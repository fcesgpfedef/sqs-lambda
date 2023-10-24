import axios from 'axios';
import  { MongoClient }  from 'mongodb';
const url = 'mongodb+srv://qct_test:DDFMd0WyAXTlfM2c@cluster0.1p24moe.mongodb.net';
const client = new MongoClient(url);
const dbName = 'superMind';
const db = client.db(dbName);

export const makeZoomCall = async (config, accountID) => {
    return new Promise(async(resolve, reject) => {
        axios.request(config)
        .then((response) => {
            resolve(response.data);
        })
        .catch((error) => {
            console.log(error.response.data.message);

            //Updating token if expired
            if (error?.response?.data?.message === 'Access token is expired.'){
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountID}`,
                    headers: { 
                        'Authorization': 'Basic WGxtaW4xSWpUTlM0dHVXU09tYVU4QTpZaTBWQ3VJU1NUbkYxNEs0bWdlbmdjR0l5Z3Z2b2ZFUw==', 
                    }
                };

                axios.request(config)
                .then(async (response) => {
                    // console.log(JSON.stringify(response.data.access_token));
                    await db.collection('tokens').updateOne({accountName:'Sagar'},{$set:{token:response.data.access_token}});
                })
                .catch((error) => {
                    console.log(error);
                });
            }
        });
    });
}

