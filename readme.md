#  Token transfer bot (10000 wallets)

## Explain
    This bot transfer tokens from main wallet to 10000 new wallets.
    These 10000 wallet private keys are saved in "data2.json"

## Contact me

If you have any question or something, feel free to reach out me anytime via telegram, discord or twitter.

- Discord: @erikerik116

- Telegram: @erikerik116

## parameta in env file
1. BASE_MINT=   # Token mint address
 
2. MAIN_KP=    # main wallet address.
        The main wallet should have enough sol to transfer tokens to 10000 wallets
        
3. RPC_URL=    # RPC WebSocket endpoint for Solana

4. WALLET_COUNT =    # wallet count
        The count of wallet that main wallet transfer token to

5. WALLET_BUNDLE =    # wallet count of one transaction bundle
        This shuold be 5.

6. TOKEN_AMOUNT =    # token amount to transfer to each wallets.
        if u want transfer same amount token to each wallets, u can use this value.

7. TOKEN_DECIMAL =    # token decimal
        This is initial setting value of token.

8. MAX_AMOUNT =    # Max token amount to transfer 

9. MIN_AMOUNT =    # Min token amount to transfer 

        

## Guide
-  First set the env value.
    *especially, "WALLET_BUNDLE" should be 5.
-  second type "npm run start" in terminal
