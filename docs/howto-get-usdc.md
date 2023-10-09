## How to get UDSC on Mantle testnet

1. Get an API key from Circle

 https://developers.circle.com/developer/docs/circle-payments-api-quickstart#1-get-an-api-key

2. Install Circle web application

https://developers.circle.com/developer/docs/circle-payments-api-quickstart#2-install-the-sample-application


`Note: Add the API key in the setting page`

3. Get USDC from a test credit card (using chrome)

http://localhost:3011/flow/charge/existing-card

Note: use the `Add Card` button to prefill the form with the test credit card number. 

5. Check account balance

http://localhost:3011/debug/businessAccount/balances/fetch

Once there result shows USDC in the available section, goto next step to transfer the funds to an external wallet.

6. Transfer the USDC from your Circle wallet to external wallet
https://app-sandbox.circle.com
 
7. Bridge the USDC from Goerlie to Mantle testnet

https://bridge.testnet.mantle.xyz

