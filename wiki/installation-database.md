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

The easy way

```
sudo snap install couchdb
```

Or the hard way.

Linux, MacOS and Windows users will need to install from [couchdb website](https://couchdb.apache.org/#download)

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