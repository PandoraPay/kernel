const cluster = require('cluster');
const sticky = require('sticky-session');
const os = require('os');

const server = require('http').createServer(function(req, res) {
    res.end('worker: ' + cluster.worker.id);
});

const cpus = os.cpus().length;

if (cluster.isMaster) {

    console.log("MASTER", cpus);

    for (var i=0; i< cpus; i++)
        cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });

} else {

    console.log("WORKER");

    sticky.listen(server, 3000, ()=>{

        console.log('MASTER CREATED on port 3000');

    });



}