## Instructions to Run

In the root directory, run:
```
npm i
ganache-cli
```

In a new terminal, Run the following:
```
truffle compile
truffle migrate --network development
```

Following this you will get the contract addresses of the three deployed contracts. Put those addresses in the client/src/utils/ethers.js file.

Then run:
```
cd client
npm i
npm run dev
```

This is run the client app on the following url:

```
http://localhost:5713
```

In another terminal, run the backend app that send articles to the ipfs server for storage:
```
cd backend
npm i
node server.js
```

Then you can interact with the frontend, submit content on the submissions tab. These submissions go to the Pinata IPFS server.