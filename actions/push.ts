import * as PushAPI from "@pushprotocol/restapi";
import * as ethers from "ethers";
import {Context} from "@tenderly/actions";
import {ENV} from "@pushprotocol/restapi/src/lib/constants";

const PK = 'your_channel_address_secret_key'; // channel private key
const Pkey = `0x${PK}`;
const _signer = new ethers.Wallet(Pkey);

export const sendPushNotification = async(type:string, text: string, channel: string, context: Context) => {
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
                cta: '',
                img: ''
            },
            channel: `eip155:5:${channel}`, // your channel address
            env: ENV.STAGING
        });

}