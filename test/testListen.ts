import { TestRuntime } from "@tenderly/actions-test";
import { listenForProposalFn } from "../actions/listen";
import { proposalExample } from "./proposal"

const main = async () => {
    const runtime = new TestRuntime();
    const listenEvent = await proposalExample()
    await runtime.execute(listenForProposalFn, listenEvent);
    console.log(await runtime.context.storage.getJson("current_proposals"))
}
(async () => await main())();