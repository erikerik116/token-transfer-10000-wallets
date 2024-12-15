import {
    PublicKey, Keypair, Connection, ComputeBudgetProgram, sendAndConfirmTransaction, VersionedTransaction, TransactionMessage, TransactionInstruction, SystemProgram,
    LAMPORTS_PER_SOL, Transaction
} from "@solana/web3.js";
import {
    NATIVE_MINT, TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction, getAssociatedTokenAddress, getMint,
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction, createTransferInstruction
} from "@solana/spl-token";
import { jitoWithAxios } from "./src/jitoWithAxios";
import base58 from "bs58";
import { retrieveEnvVariable, saveDataToFile, sleep, readJson } from "./src/utils";
import { Liquidity, LiquidityPoolKeysV4, MAINNET_PROGRAM_ID, InstructionType, Percent, CurrencyAmount, Token, SOL, LiquidityPoolInfo, TokenAmount } from "@raydium-io/raydium-sdk";
import { derivePoolKeys } from "./src/poolAll";
import { BN } from "bn.js";

// Environment Variables3
const baseMintStr = retrieveEnvVariable('BASE_MINT');
const mainKpStr = retrieveEnvVariable('MAIN_KP');
const rpcUrl = retrieveEnvVariable("RPC_URL");
const poolId = retrieveEnvVariable('POOL_ID');
const mode = retrieveEnvVariable('MODE');
const TOKEN_AMOUNT = Number(retrieveEnvVariable('TOKEN_AMOUNT')) * 10 ** 9


// Solana Connection and Keypair
const connection = new Connection(rpcUrl, { commitment: "confirmed" });
const mainKp = Keypair.fromSecretKey(base58.decode(mainKpStr));
// const mintKp = Keypair.fromSecretKey(base58.decode(baseMintStr));
const baseMint = new PublicKey(baseMintStr);
const commitment = "confirmed"


let poolKeys: LiquidityPoolKeysV4 | null = null;
let tokenAccountRent: number | null = null;
let decimal: number | null = null;
let poolInfo: LiquidityPoolInfo | null = null;


const run = async () => {
    console.log("============================ Bot start ===============================");
    try {
        let index = 0;
        for (let i = 0; i < 200; i++) {

            console.log("============================ Mainkey ===============================");

            console.log("Mainkey=============>", base58.encode(mainKp.secretKey));
            const mainKpBalance = (await connection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL;
            console.log("Main keypair balance :", mainKpBalance);

            const tx = new Transaction().add(
                ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 100_000,
                }),
                ComputeBudgetProgram.setComputeUnitLimit({
                    units: 200_000,
                })
            )

            for (let j = 0; j < 5; j++) {
                console.log("============================ Buyerkey ===============================");

                const buyerKp = Keypair.generate();
                saveDataToFile([base58.encode(buyerKp.secretKey)], "data2.json")
                console.log("buyer=============>", base58.encode(buyerKp.secretKey));
                index++;
                console.log("buyer index=============>", index);
                console.log("Buyer keypair :", buyerKp.publicKey.toBase58());
                const buyerBalance = (await connection.getBalance(buyerKp.publicKey)) / LAMPORTS_PER_SOL;
                console.log("Buyer keypair balance :", buyerBalance);

                tx.add(
                    SystemProgram.transfer({
                        fromPubkey: mainKp.publicKey,
                        toPubkey: buyerKp.publicKey,
                        lamports: 1000000
                    })
                )
                const srcAta = await getAssociatedTokenAddress(baseMint, mainKp.publicKey)

                const ata = await getAssociatedTokenAddress(baseMint, buyerKp.publicKey)
                const info = await connection.getAccountInfo(ata)
                if (!info)
                    tx.add(
                        createAssociatedTokenAccountInstruction(
                            mainKp.publicKey,
                            ata,
                            buyerKp.publicKey,
                            baseMint
                        )
                    )
                console.log(info);

                tx.add(
                    createTransferInstruction(
                        srcAta,
                        ata,
                        mainKp.publicKey,
                        TOKEN_AMOUNT
                    )
                )
            }


            tx.feePayer = mainKp.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

            console.log(await connection.simulateTransaction(tx))

            const signature = await sendAndConfirmTransaction(connection, tx, [mainKp], { skipPreflight: true, commitment: commitment });

            console.log(`Transfer Tokens : https://solscan.io/tx/${signature}`)
            await sleep(3000)
        }

    } catch (error) {
        console.log("error", error);
    }
}



run();
