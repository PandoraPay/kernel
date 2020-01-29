const cluster = require('cluster');
const sticky = require('sticky-session');

const server = require('http').createServer(function(req, res) {
    res.end('worker: ' + cluster.worker.id);
});

if ( !sticky.listen(server, 3000) ) {

    // Master code

    server.once('listening', () => {
        console.log('MASTER CREATED on port 3000');
    });

} else {

    // Worker code

    console.log("WORKER CREATED");

}