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
const WALLET_COUNT = Number(retrieveEnvVariable('WALLET_COUNT'))
const WALLET_BUNDLE = Number(retrieveEnvVariable('WALLET_BUNDLE'))

// Solana Connection and Keypair
const connection = new Connection(rpcUrl, { commitment: "confirmed" });
const mainKp = Keypair.fromSecretKey(base58.decode(mainKpStr));
const baseMint = new PublicKey(baseMintStr);
const commitment = "confirmed"


let poolKeys: LiquidityPoolKeysV4 | null = null;
let tokenAccountRent: number | null = null;
let decimal: number | null = null;
let poolInfo: LiquidityPoolInfo | null = null;



const createWallets = (): Keypair[][] => {
    let index = 0;
    const wallets: Keypair[][] = [];
    for (let i = 0; i < (WALLET_COUNT / WALLET_BUNDLE); i++) {
        const row: Keypair[] = [];
        for (let j = 0; j < WALLET_BUNDLE; j++) {

            index++;
            console.log(index);
            const buyerKp = Keypair.generate()
            saveDataToFile([base58.encode(buyerKp.secretKey)], "data2.json")
            row.push(buyerKp); // Generate a new wallet (Keypair)
            console.log(base58.encode(buyerKp.secretKey));
        }
        wallets.push(row);
    }
    return wallets;
};

const run = async () => {
    console.log("============================ Bot start ===============================");
    try {

        console.log("============================ Mainkey ===============================");
        console.log("Mainkey=============>", base58.encode(mainKp.secretKey));
        const mainKpBalance = (await connection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL;
        console.log("Main keypair balance :", mainKpBalance);
        const walletArray = createWallets();
        console.log(walletArray);
        console.log(`Total wallets: ${walletArray.length * walletArray[0].length}`);

        let count = 0;
        walletArray.map(async (wallets, index) => {
            count++;
            try {


                const tx = new Transaction().add(
                    ComputeBudgetProgram.setComputeUnitPrice({
                        microLamports: 100_000,
                    }),
                    ComputeBudgetProgram.setComputeUnitLimit({
                        units: 200_000,
                    })
                )

                for (let j = 0; j < wallets.length; j++) {
                    console.log("============================ Buyerkey ===============================");

                    console.log("Buyer keypair :", wallets[j].publicKey.toBase58());
                    const buyerBalance = (await connection.getBalance(wallets[j].publicKey)) / LAMPORTS_PER_SOL;
                    console.log("Buyer keypair balance :", buyerBalance);

                    // tx.add(
                    //     SystemProgram.transfer({
                    //         fromPubkey: mainKp.publicKey,
                    //         toPubkey: wallets[j].publicKey,
                    //         lamports: 1000000
                    //     })
                    // )
                    const srcAta = await getAssociatedTokenAddress(baseMint, mainKp.publicKey)

                    const ata = await getAssociatedTokenAddress(baseMint, wallets[j].publicKey)
                    const info = await connection.getAccountInfo(ata)
                    if (!info)
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                mainKp.publicKey,
                                ata,
                                wallets[j].publicKey,
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

                console.log(`Transfer Tokens ${count}: https://solscan.io/tx/${signature}`)


            } catch (error) {
                console.log("error", error);
            }
            await sleep(index * 500)
        })

    } catch (error) {
        console.log("error", error);
    }
}



run();
