import fs from "node:fs";
import { Transaction, Action, SignedTransaction, ABI, Serializer } from "@greymass/eosio"
import { rpc, ACCOUNT, ACTOR, PRIVATE_KEY } from "./config.js";

export const abi = ABI.from(JSON.parse(fs.readFileSync("example.abi", {encoding: "utf-8"})))

export function hex_to_string( hex: string )
{
    return Buffer.from(hex, "hex").toString("utf-8").replace("\x16", "");
}

export async function push_action( name: string, data: any ) {
    const action = Action.from({
        authorization: [ { actor: ACTOR, permission: 'active' } ],
        account: ACCOUNT,
        name,
        data,
    }, abi)
    return push_transaction( [action] );
}

export async function push_transaction( actions: Action[] ) {
    const info = await rpc.v1.chain.get_info();
    const header = info.getTransactionHeader();
    const transaction = Transaction.from({ ...header, actions });
    const signatures = [PRIVATE_KEY.signDigest(transaction.signingDigest(info.chain_id))];
    const signedTransaction = SignedTransaction.from({ ...transaction, signatures });
    try {
        const result = await rpc.v1.chain.push_transaction(signedTransaction)
        return result;
    } catch (e: any) {
        const error = e?.error?.details[0].message.replace("assertion failure with message: ", "");
        throw Error(error || e);
    }
}