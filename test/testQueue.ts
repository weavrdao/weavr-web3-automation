import {TestBlockEvent, TestRuntime} from "@tenderly/actions-test";
import * as env from 'env-var';
import { queueProposalsFn } from "../actions/queue";
import { proposalExample} from "./proposal";
import {listenForProposalFn} from "../actions/listen";

const PRIVATE_KEY = env.get("PRIVATE_KEY").required().asString();
const PROVIDER_KEY = env.get("PROVIDER_KEY").required().asString();

const main = async () => {
    const runtime = new TestRuntime();
    runtime.context.secrets.put("WEAVR_ADDRESS", "0x43240c0f5dedb375afd28206e02110e8fed8cFc0")
    runtime.context.secrets.put("PRIVATE_KEY", PRIVATE_KEY)
    runtime.context.secrets.put("PROVIDER_KEY", PROVIDER_KEY)
    const testEvent = new TestBlockEvent();
    testEvent.blockNumber = 56969671
    const listenEvent = await proposalExample()
    await runtime.execute(listenForProposalFn, listenEvent)
    await runtime.execute(queueProposalsFn, testEvent)
}
(async () => await main())();