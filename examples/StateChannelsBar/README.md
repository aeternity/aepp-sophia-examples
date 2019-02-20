# ae-state-channels-demo
STATE CHANNEL DEMO

То run this demo you should update your docker image 
```docker pull aeternity/aeternity:latest```

also you should install "Allow CORS: Access-Control-Allow-origin" browser extension and allow CORS for localhost.

clone this repo
```git clone this_repo```

install packages
```npm install```

run the demo
```npm start```

The demo app can be started on http://localhost:4000

You as client and "the bar" as back end, in a browser you can paste your private/secret key to OPEN a channel, sign ON and OFF chain txs are in the front end.
Back end, check and sign transactions too with own private/secret key.

To open and close a state channel, 30k aettos are needed.

The app demonstrates how you deposit some aettos, create on chain tx and after that you can purchase some items/products from "the bar " where all txs are very fast and transparent. You have basic history and can watch your balance

If there is no off chain transaction for less than a minute channel close itself.
There are some logs in the browser and terminal.

!!! PS: if you cannot shutdown/close the state channel (throw an error), you should RESTART the node :)