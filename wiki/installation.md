#### Installation Requirements

0. node.js >= 10.12
1. npm

#### Installing node.js via npm

#### Linux

##### Install a C++ compiler

In case none is already installed
```
apt-get update
apt-get install build-essential libssl-dev
```

##### Install NVM( Node Version Manager)

[Web Tutorial](https://www.liquidweb.com/kb/install-nvm-node-version-manager-node-js-ubuntu-16-04-lts/) or use the following bash

```
curl https://raw.githubusercontent.com/creationix/nvm/v0.25.0/install.sh | bash
source ~/.profile
nvm ls-remote
apt-get install git
```

```
nvm install 11.6
nvm use default 11.6
node --version
```

#### Common Installation Issues




##### Webpack installation problem.

In case you encounter problems with webpack, use the following steps.

```
npm cache clean --force

npm install webpack
npm install webpack-cli
```

