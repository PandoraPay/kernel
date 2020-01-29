import {asyncTimeout} from "src/helpers/async-interval"
import describe from 'tests/tests/unit-testing/describe';
import MasterCluster from "src/cluster/master-cluster"
import Helper from "src/helpers/helper";

export default function run (){


    describe("master cluster", {

        'creation': async function () {

            const masterCluster = await this._scope.app.createMasterCluster(  );

            this.expect(typeof masterCluster, "object");

            await masterCluster.start();

            this.expect( typeof masterCluster.clientsCluster, "object");
            this.expect( typeof masterCluster.serverCluster, "object");

            if ( masterCluster.isMasterCluster ) { //master

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
