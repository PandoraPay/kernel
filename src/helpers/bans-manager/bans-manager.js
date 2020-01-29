/**
 * BansManager facilitates methods to ban peers and data 
 */

export default class BansManager {

    constructor(scope){

        this._scope = scope;
        this._startedStatus = false;

        this._bans =  this._scope.argv.bansManager.bans || {
            forever: {

            }
        };
        
    }

    async start(){

        if (this._startedStatus) return true;

        await this._started();

        this._startedStatus = true;
    }

    async _started(){

        if (this._scope.argv.debug.enabled)
            this._debugInterval = setInterval( this.list.bind(this), 60000 );

    }

    async stop(){

        if (!this._startedStatus) return true;

        await this._stopped();

        this._startedStatus = false;
    }

    _stopped(){
        if (this._scope.argv.debug.enabled)
            clearInterval(this._debugInterval);
    }

    /**
     * @param banCategory
     * @param banId
     * @param timeout
     * @param handleBanExpired
     */
    addBan( banCategory="default", banId, timeout = this._scope.argv.bansManager.defaultBanTimeout, handleBanExpired, propagateToOtherNodes = false ){
        
        if (!this._bans[banCategory])
            this._bans[banCategory] = { length: 0};

        if (!this._bans[banCategory][banId]) //new ban
            this._bans[banCategory].length ++;
        else
            clearTimeout(this._bans[banCategory][banId]); //remove old timeout 
        
        this._bans[banCategory][banId] = {
            banId: banId,
            timeout: new Date().getTime() + timeout,
            timeoutId: setTimeout( ()=>{

                this.removeBan(banCategory, banId);
                handleBanExpired(banCategory, banId);

            }, timeout),
        };

        if (propagateToOtherNodes){

        }

    }

    /**
     *
     * @param banCategory
     * @param banId
     */
    removeBan(banCategory="default", banId){

        if (this._bans[banCategory] && this._bans[banCategory][banId]) {

            clearTimeout(this._bans[banCategory][banId].timeoutId);

            delete this._bans[banCategory][banId];
            this._bans[banCategory].length --;

            if (this._bans[banCategory].length === 0)
                delete this._bans[banCategory]
        }

    }

    /**
     *
     * @param banCategory
     * @param banId
     * @returns {*}
     */
    checkBan(banCategory="default", banId){

        return this._bans.forever[banId] || this._bans[banCategory] && this._bans[banCategory][banId];
        
    }

    list(){

        for (const banCategory in this._bans) {

            let str = "";
            for (const banId in this._bans[banCategory])
                str += banId+"  ";

            if (str)
                this._scope.logger.log(this, `Banned ${banCategory}`, str);

        }

    }

}