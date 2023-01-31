import {
	ActionFn,
	Context,
	Event, TransactionEvent,
} from '@tenderly/actions';
import { ethers } from "ethers";
import Weavr from "./Weavr.json"


/***
 * Listen for Proposal events and store them in the context to be used by the queue action
 * @param context
 * @param event
 */
export const listenForProposalFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	const result = iface.decodeEventLog("Proposal",
		txEvent.logs[0].data, txEvent.logs[0].topics)
	var {id, proposalType, creator, superMajority, info} = result;
	id = id.toString()
	proposalType = proposalType.toString()
	let current_proposals: Array<Object>;
	if( Object.keys(await context.storage.getJson("current_proposals")).length === 0 ) {
		current_proposals = [];
	} else {
		current_proposals = await context.storage.getJson("current_proposals");
	}
	const next_proposal = {id: id, block_number: txEvent.blockNumber};
	current_proposals.push(next_proposal)
	await context.storage.putJson("current_proposals", current_proposals);
	console.log("Proposal found: ", id, proposalType, creator, superMajority, info);
}
