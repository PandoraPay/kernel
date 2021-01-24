const {asyncTimeout} = require("../../../../src/helpers/async-interval")
const describe = require( '../../unit-testing/describe');
const MasterCluster = require("../../../../src/cluster/master-cluster")
const Helper = require( "../../../../src/helpers/helper");

module.exports = function run (){


    describe("master cluster", {

        'creation': async function () {

            const masterCluster = await this._scope.app.createMasterCluster(  );

            this.expect(typeof masterCluster, "object");

            await masterCluster.start();

            this.expect( typeof masterCluster.clientsCluster, "object");
            this.expect( typeof masterCluster.serverCluster, "object");

            if ( masterCluster.isMaster ) { //master

                await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0 );

                await masterCluster.close();

            } else  { //slave

                this.expect( 1,1);

                await asyncTimeout( ()=>{
                    //nothing
                }, 1000);

                process.exit(1);

            }


        },

    });

}
