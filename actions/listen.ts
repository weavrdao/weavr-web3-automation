import {
	ActionFn,
	Context,
	Event, TransactionEvent,
} from '@tenderly/actions';
import { ethers } from "ethers";
import Weavr from "./Weavr.json"
import {notifyDiscord} from "./discord";
import {sendPushNotification} from "./push";





function listenForEvent(event: string, txEvent: TransactionEvent, iface: ethers.utils.Interface) {
	let result = null;
	for (let i = 0; i < txEvent.logs.length; i++) {
		try {
			result = iface.decodeEventLog(event,
				txEvent.logs[i].data, txEvent.logs[i].topics)
		} catch (e) {
			console.log("This event is not a Proposal", e)
		}
	}
	return result
}

async function notifyChannels(message: string, context: Context, title: string = "") {
	await notifyDiscord(message, context)
	await sendPushNotification(title, message, "0x49C899a1fA59A7edf23c249d491805c9077bf62B", context)
}




/***
 * Listen for Proposal events and store them in the context to be used by the queue action
 * @param context
 * @param event
 */
export const listenForProposalFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	let result = listenForEvent("Proposal", txEvent, iface)
	if(result === null) {
		console.log("Did not find proposal event, exiting")
		return
	}
	let {id, proposalType, creator, superMajority, info} = result;
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
	await notifyChannels(`New Proposal ${id} has been detected! https://www.weavr.org/#/dao/0x43240c0f5dedb375afd28206e02110e8fed8cFc0/proposal/${id}`, context)
}

export const UpdateOnProposalStateChangeFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	let result = listenForEvent("ProposalStateChange", txEvent, iface)
	if(result === null) {
		console.log("Did not find ProposalStateChange event, exiting")
		return
	}
	let {id, state} = result;
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
	await notifyChannels(`Proposal ${id} state is now ${state}, https://www.weavr.org/#/dao/0x43240c0f5dedb375afd28206e02110e8fed8cFc0/proposal/${id}`, context)
}

export const UpdateOnParticipantStateChangeFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	let result = listenForEvent("ParticipantChange", txEvent, iface)
	if(result === null) {
		console.log("Did not find ParticipantChange event, exiting")
		return
	}
	let {participantType, participant } = result;
	let PARTICIPANT_TYPE_ENUM = [
		"Null",
		"Removed",
		"Genesis",
		"KYC",
		"Governor",
		"Voucher",
		"Individual Member",
		"Corporate Member"
		]
	const state = PARTICIPANT_TYPE_ENUM[participantType]
	await notifyChannels(`participant ${participant} state is now ${state}`, context)
}


export const listenForProposalVotesFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	let result = listenForEvent("Vote", txEvent, iface)
	if(result === null) {
		console.log("Did not find Vote event, exiting")
		return
	}
	let {id, voter, votes} = result;
	id = id.toString()
	votes = (votes / 1e18).toString()
	await notifyChannels(`${voter} has just voted on proposal #${id} with a voting weight of ${votes}`, context)
}

export const listenForVouchesFn: ActionFn = async (context: Context, event: Event) => {
	const txEvent = event as TransactionEvent;
	let iface = new ethers.utils.Interface(Weavr.abi);
	let result = listenForEvent("Vouch", txEvent, iface)
	if(result === null) {
		console.log("Did not find Vouch event, exiting")
		return
	}
	let {vouchee, voucher} = result;
	await notifyChannels(`${voucher} has just vouched for for ${vouchee}, welcome.`, context)
}