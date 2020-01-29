import ArgvClientsMasterCluster from "./clients/argv-clients-cluster"
import ArgvServerMasterCluster from "./server/argv-server-cluster"

/**
 * Arguments for Master Cluster
 */

export default {

    /**
     * This enables/disables Client/Server Clusters entirely
     */
    enableClusters: true,

    /**
     * This will create only the master without workers
     */
    createClusters: true,

    /**
     * 0  - will be used to determine automatically the number of CPU cores
     */

    workerCount: 3,

    /**
     * Workers Env Options
     */
    workerEnv: {
    },

    /**
     * Auto respawn nodes in case they were closed
     */
    autoRespawn: true,

    isMaster: undefined,
    isWorker: undefined,

    workerName: undefined,
    workerId: 0,

    clientsCluster: ArgvClientsMasterCluster,
    serverCluster: ArgvServerMasterCluster,

    _initArgv(){

        if (!BROWSER && this.instances === 0){
            const os = require('os');
            this.instances = os.cpus().length;
        }

    }

}
