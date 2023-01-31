import {TestTransactionEvent} from "@tenderly/actions-test";
import {ethers} from "ethers";
import Weavr from "../actions/Weavr.json";



export const proposalExample = async () => {
    const proposalExample = new TestTransactionEvent();
    const iface = new ethers.utils.Interface(Weavr.abi);
    const realEvent = iface.encodeEventLog("Proposal", [27, 258, "0x6ac7f09fa05f40e229064fa20ef3d27c4c961591", false, "0x748c4870f8d0519c79bf4996a1ad01ffe6270f9ab00a0c7884385528403d25ee"])
    proposalExample.logs = [{
        address: "0x43240c0f5dedb375afd28206e02110e8fed8cFc0",
        data: realEvent.data,
        topics: realEvent.topics
    }]
    proposalExample.blockNumber = 56915944
    return proposalExample
}