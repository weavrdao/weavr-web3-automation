import * as PushAPI from "@pushprotocol/restapi";
import * as ethers from "ethers";
import {Context} from "@tenderly/actions";
import {ENV} from "@pushprotocol/restapi/src/lib/constants";


export const sendPushNotification = async(type:string, text: string, channel: string, context: Context) => {
    const secret_key = await context.secrets.get("pushPrivateKey")
    const _signer = new ethers.Wallet(secret_key);
        console.log('Sending to Push:', `🐥 ${text}`)
         await PushAPI.payloads.sendNotification({
            signer: _signer,
            type: 1, // broadcast
            identityType: 2, // direct payload
            notification: {
                title: type,
                body: text,
            },
            payload: {
                title: type,
                body: text,
                cta: 'Check WeavrDAO for the latest Updates',
                img: ''
            },
            channel: `eip155:1:${channel}`, // your channel address
            env: ENV.PROD
        });

}