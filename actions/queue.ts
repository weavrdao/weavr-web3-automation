import {
    ActionFn, BlockEvent,
    Context,
    Event,
} from '@tenderly/actions';
import { ethers } from "ethers";
import Weavr from "./Weavr.json"
import {notifyDiscord} from "./discord";

/***
 *  Queues a proposal that has been logged for a week, uses context.storage and block numbers to calculate time
 * @param context
 * @param event
 */
export const queueProposalsFn: ActionFn = async (context: Context, event: Event) => {
    const blockEvent = event as BlockEvent;
    const WEAVR_ADDRESS = await context.secrets.get("WEAVR_ADDRESS")
    const PRIVATE_KEY = await context.secrets.get("PRIVATE_KEY")
    const provider_key = await context.secrets.get("PROVIDER_KEY")
    const provider = ethers.getDefaultProvider(`https://arbitrum-mainnet.infura.io/v3/${provider_key}`)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    // let's assume that arbitrum takes 0.5 sec per block, replace this with a block.timestamp when available.
    const week_blocks = 86400*7*(1/0.5);
    const current_proposals: Array<any> = await context.storage.getJson("current_proposals")
    const weavr = new ethers.Contract(WEAVR_ADDRESS, Weavr.abi, wallet)
    const final_proposals = current_proposals.filter(async (obj: { block_number: number; id: any; }) => {
        console.log("found logged proposal: ", obj)
        if (obj.block_number + week_blocks <= blockEvent.blockNumber) {
            console.log("proposal is ready to queue: ", obj.id)
            try {
                await weavr.callStatic.queueProposal(parseInt(obj.id))
                await weavr.queueProposal(parseInt(obj.id))
                console.log("Operation succeeded: ", obj.id)
                await notifyDiscord(`Proposal ${obj.id} has been queued`, context)

            } catch (e) {
                console.log("Operation would fail:")
                await notifyDiscord(`Proposal ${obj.id} would fail to queue due to an error: ${e}`, context)
                console.log(e)
            }
            return false
        } else {
            console.log("proposal is not ready to queue: ", obj.id)
            console.log("proposal block number: ", obj.block_number)
            console.log("current block number: ", blockEvent.blockNumber)
            console.log("week blocks: ", week_blocks)
            return true
        }
    });
    await context.storage.putJson("current_proposals", final_proposals);

}