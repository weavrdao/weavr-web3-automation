import {
	ActionFn,
	Context,
	Event, TransactionEvent,
} from '@tenderly/actions';
import { ethers } from "ethers";
import Weavr from "./Weavr.json"
import {notifyDiscord} from "./discord";

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
	await notifyDiscord(`New Proposal ${id} has been detected! https://www.weavr.org/#/dao/0x43240c0f5dedb375afd28206e02110e8fed8cFc0/proposal/${id}`, context)
}

export const updateOnStateChangeFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	const result = iface.decodeEventLog("ProposalStateChange",
		txEvent.logs[0].data, txEvent.logs[0].topics)
	var {id, state} = result;
	id = id.toString()
	let STATES_ENUM = [
		"Null",
		"Active",
		"Queued",
		"Executed",
		"Cancelled"
	]
	state = STATES_ENUM[state]
	let final_proposals: Array<Object>;
	const current_proposals: Array<any> = await context.storage.getJson("current_proposals")
	if(state === "Queued" || state === "Executed" || state === "Cancelled"){
		final_proposals = current_proposals.filter((obj: { id: any; }) => {
			if(obj.id === id){return false} else { return true}
		})
		await context.storage.putJson("current_proposals", final_proposals)
	}
	console.log("Proposal withdrawn: ", id);
	await notifyDiscord(`Proposal ${id} state is now ${state}, https://www.weavr.org/#/dao/0x43240c0f5dedb375afd28206e02110e8fed8cFc0/proposal/${id}`, context)
}

