# Benchmarks Databases

1. Redis
2. LevelDB (pouchDB without CouchDB)
3. CouchDB (couchDB)

We recommend installing Redis or LevelDB (nothing at all)

# Installing Redis DB

```
sudo apt-get install redis
```


# Installing Couch DB

required version >= 2.0

Linux

```
$ sudo nano /etc/apt/sources.list
```
add `deb https://apache.bintray.com/couchdb-deb xenial main` and save it

```
curl -L https://couchdb.apache.org/repo/bintray-pubkey.asc | sudo apt-key add -
sudo apt-get install apt-transport-https
sudo apt-get update && sudo apt-get install couchdb
```

if you encounter issues, install PouchDB Server using npm ( not recommended )
```
$ npm install -g pouchdb-server
$ pouchdb-server --port 5984
```

MacOS and Windows users will need to install from [couchdb website](https://couchdb.apache.org/#download)

Verify installation

```
curl localhost:5984
``` 
should return an answer like `{"couchdb":"Welcome","version":"2.2.0",...}`

Version must >= 2.0

Open the Couch DB utilus in browser [http://localhost:5984/_utils/](http://localhost:5984/_utils/)

Setup CORS

```
npm install -g add-cors-to-couchdb
add-cors-to-couchdb

```

# Installing Level DB

LevelDB is a local database and it doesn't require any installation. Unfortunately a LevelDB instance can be runned by only one instance. So, a cluster of node instances will create a cluster of separate and independent node.js instances.