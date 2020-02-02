##### Install the Package

The package is compatible with every distribution of MacOS, Linux and Windows. Follow the [tutorial to install all requirements](./installation.md)

###### Requirements

If you already installed the package, you can skip the requirements.

    1. node.js - we recommend you to install via the nvm
    2. npm
    3. webpack

Installing package modules

```
npm install
```

###### Update each dependency in the package to the latest version

This is not recommended, due to the fact each package update must be **manually** reviewed and approved.

```
npm i -g npm-check-updates
npm install
```

##### Run

To run the package, hit the next command

```
npm run app
```

##### Tests

To test the package, hit the next command
```
npm run app -- --tests:enabled
```

##### Build

To build the package, hit the next command
```
npm run build -- --tests  --mode development
```

###### Transpile Protocol package"

```
npm run build -- --tests
```


##### Add Sharable Modules in node_modules

To share local modules between packages, use npm-link as follows

cd ~/zero/blockchain/async-events ;
npm link ;

cd ~/zero/blockchain/webpack-config ;
npm link ;

cd ~/zero/blockchain/sticky-session ;
npm link ;
npm link async-events ;

cd ~/zero/blockchain/kernel ;
npm link ;
npm link async-events ;
npm link sticky-session ;
npm link webpack-config ;

cd ~/zero/blockchain/Cryptography ;
npm link ;
npm link sticky-session ;
npm link webpack-config ;
npm link kernel ;

cd ~/zero/blockchain/Networking ;
npm link ;
npm link sticky-session ;
npm link webpack-config ;
npm link kernel

cd ~/zero/blockchain/Blockchain ;
npm link ;
npm link sticky-session ;
npm link webpack-config ;
npm link kernel ;
npm link networking ;
npm link cryptography ;

cd ~/X/Consensus ;
npm link ;
npm link async-events ;
npm link sticky-session ;
npm link webpack-config ;
npm link kernel ;
npm link networking ;
npm link cryptography ;
npm link blockchain ;

cd ~/X/Explorer ;
npm link async-events ;
npm link sticky-session ;
npm link webpack-config ;
npm link kernel ;
npm link networking ;
npm link cryptography ;
npm link blockchain ;
npm link consensus ;

cd ~/X/kernel;
npm run build -- --es5 ;
cd ~/X/Cryptography;
npm run build -- --es5 ;
cd ~/X/Networking;
npm run build -- --es5 ;
cd ~/X/Blockchain;
npm run build -- --es5 ;
cd ~/X/Consensus;
npm run build -- --es5 ;



cd ~/X/Protocol; npm run build ;
cd ~/X/Cryptography; npm run build ;
cd ~/X/Networking; npm run build ;
cd ~/X/Blockchain; npm run build ;
cd ~/X/Consensus; npm run build ;

cd ~/X/Protocol; npm run build-browser ;
cd ~/X/Cryptography; npm run build-browser ;
cd ~/X/Networking; npm run build-browser ;
cd ~/X/Blockchain; npm run build-browser ;
cd ~/X/Consensus; npm run build-browser ;



Usually redo