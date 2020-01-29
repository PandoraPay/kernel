const EventsBasic = require('events');

export default class Events extends EventsBasic{

    on(){

        super.on.apply(this, arguments);

        return () => this.off.apply(this, arguments)
    }

    once(){
        super.once.apply(this, arguments);

        return () => this.off.apply(this, arguments)
    }

}

